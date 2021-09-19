import os
from twilio.rest import Client
from flask import Flask
from dotenv import load_dotenv

app = Flask(__name__)


# Your Account Sid and Auth Token from twilio.com / console
load_dotenv()
account_sid = os.environ['TWILIO_ACCOUNT_SID']
auth_token = os.environ['TWILIO_AUTH_TOKEN']
account_number = '+15623035594'

client = Client(account_sid, auth_token)

''' Change the value of 'from' with the number 
received from Twilio and the value of 'to'
with the number in which you want to send message.'''

# write GET request to send right parameters to message body
@app.route("/")
# TODO: BriYan
def send_msg():
    message = client.messages.create(
        from_= account_number,
        body='Hi from Sentri! Here are your directions from Broad Art Center to 385 Charles E Young Dr E ( https://goo.gl/maps/MzwdUNoKN9pn5kGy5 ) in Google Maps.',
        to='+15102804911'
    )
    print(message.sid)
    return(message.sid)


if __name__ == "__main__":
    app.run()
