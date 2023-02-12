import datetime
import json
import re
import time

import jwt
import pyotp
import requests
import os

from pynamodb.attributes import UnicodeAttribute, NumberAttribute
from pynamodb.models import Model

import sentry_init


class OTP(Model):
    class Meta:
        table_name = "simple-otp-secrets"
    id = UnicodeAttribute(hash_key=True)  # email or phone number
    otp_secret = UnicodeAttribute()
    counter = NumberAttribute()
    expires = NumberAttribute()


def otp_verification_start(event, context):
    res = {
        "statusCode": 200,
        "body": "",
        "headers": {  # CORS
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": True,
        }
    }
    email = event["queryStringParameters"].get("email")
    phone = event["queryStringParameters"].get("phone")
    if email:
        email = email.strip().lower()
    if phone:
        phone = re.sub(r'\D', '', phone.strip())

    if not email and not phone or email and phone:
        res.update({
            "statusCode": 400,
            "body": json.dumps({"error": "Please specify either email or phone"})
        })
        return res

    if email and not re.fullmatch(r'[^@]+@[^@]+\.[^@]+', email):
        res.update({
            "statusCode": 400,
            "body": json.dumps({"error": "Invalid email address"})
        })
    elif phone and not re.fullmatch(r'\+?[0-9\- \(\)]+', phone):
        res.update({
            "statusCode": 400,
            "body": json.dumps({"error": "Invalid phone number"})
        })
    otp_id = email or phone
    try:
        otp = OTP.get(otp_id)
        otp.counter += 1
    except OTP.DoesNotExist:
        otp = OTP(
            otp_id,
            otp_secret=pyotp.random_base32(),
            counter=0,
            expires=int(time.time()) + 60 * 5  # 5 minutes
        )
    otp.save()
    hotp = pyotp.HOTP(otp.otp_secret)
    otp_code = hotp.at(otp.counter)  # use 30 seconds interval
    if email:
        # send email
        resp = requests.post(
            f"https://api.mailgun.net/v3/{os.environ['MAILGUN_SENDING_DOMAIN']}/messages",
            auth=("api", os.environ["MAILGUN_API_KEY"]),
            data={
                "from": os.environ["MAILGUN_FROM_EMAIL"],
                "to": [email],
                "subject": "Verify your email address",
                "text": f"Your PIN: {otp_code}"
            }
        )
        resp.raise_for_status()
    elif phone:  # phone number
        # send SMS
        resp = requests.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{os.environ['TWILIO_ACCOUNT_SID']}/Messages.json",
            auth=(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"]),
            data={
                "To": f'+{phone}',
                "From": os.environ["TWILIO_FROM_NUMBER"],
                "Body": f"Your PIN: {otp_code}"
            }
        )
        resp.raise_for_status()
    res.update({
        "statusCode": 200,
        "body": json.dumps({"success": True})
    })
    return res


def otp_verification_complete(event, context):
    pin = event["queryStringParameters"]["pin"]
    email = event["queryStringParameters"].get("email")
    phone = event["queryStringParameters"].get("phone")
    if email:
        email = email.strip().lower()
    if phone:
        phone = re.sub(r'\D', '', phone.strip())

    res = {
        "statusCode": 200,
        "body": "",
        "headers": {  # CORS
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": True,
        }
    }

    if not email and not phone or email and phone:
        res.update({
            "statusCode": 400,
            "body": json.dumps({"error": "Please specify either email or phone"})
        })
        return res

    if email and not re.fullmatch(r'[^@]+@[^@]+\.[^@]+', email):
        res.update({
            "statusCode": 400,
            "body": json.dumps({"error": "Invalid email address"})
        })
        return res
    elif phone and not re.fullmatch(r'\+?[0-9\- \(\)]+', phone):
        res.update({
            "statusCode": 400,
            "body": json.dumps({"error": "Invalid phone number"})
        })
        return res

    otp_id = email or phone
    try:
        otp = OTP.get(otp_id)
    except OTP.DoesNotExist:
        res.update({
            "statusCode": 400,
            "body": json.dumps({"error": "OTP code not found. Is it expired?"})
        })
        return res

    hotp = pyotp.HOTP(otp.otp_secret)
    if not hotp.verify(pin, otp.counter):
        res.update({
            "statusCode": 400,
            "body": json.dumps({"error": "Invalid PIN"})
        })
        return res
    otp.delete()
    sub = f'email:{email}' if email else f'tel:{phone}'

    # return JWT token
    token = jwt.encode(
        {
            'iss': 'https://otp.potapov.dev/',
            'aud': 'https://api.potapov.dev/',
            'sub': sub,
            'iat': datetime.datetime.utcnow(),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        },
        os.environ["JWT_SECRET"],
        algorithm="HS256"
    )
    res.update({
        "statusCode": 200,
        "body": json.dumps({
            "token": token
        })
    })
    return res

