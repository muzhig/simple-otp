# Simple OTP Authorizer
[LIVE DEMO](https://otp.potapov.dev)

This repo is a source code for [the article about building your own simple OTP authorization service](https://potapov.dev/blog/building-simple-otp/), allowing signing secure JWT tokens upon OTP token verification.

The article explores the implementation of a Simple OTP microservice, a secure method for user authorization. The Simple OTP microservice verifies a user's email or phone number through the use of One-Time Passcodes (OTP) and then generates a crypto-signed JSON Web Token (JWT) upon successful verification. The JWT token can then be used to access authorized API endpoints in a secure manner.

In this article, we delve into the details of the Simple OTP microservice and its implementation, covering the storage of OTP secrets, generation of OTP codes, and usage of JWT tokens. Additionally, we will discuss potential improvements to enhance the security and functionality of the Simple OTP microservice.
