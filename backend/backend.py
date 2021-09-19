import os
from twilio.rest import Client
from flask import Flask
app = Flask(__name__)


# Your Account Sid and Auth Token from twilio.com / console
account_sid = 'AC0847a708127b7a366e75ef44e42e3cbf'
auth_token = '4df2543d521bbb67d6f65a379140a729'
account_number = '+15623035594'

client = Client(account_sid, auth_token)

''' Change the value of 'from' with the number 
received from Twilio and the value of 'to'
with the number in which you want to send message.'''


@app.route("/")
def send_msg():
    message = client.messages.create(
        from_=account_number,
        body='',
        to='+15102804911'
    )
    print(message.sid)


if __name__ == "__main__":
    app.run()
