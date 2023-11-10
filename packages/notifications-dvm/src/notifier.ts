
/** */
export async function sendText(to: string, message: string, config: any) {
    console.log(to, message, config.twilio.account_sid, config.twilio.auth_token, config.twilio.from_number_text)
    try {
        fetch('https://api.twilio.com/2010-04-01/Accounts/' + config.twilio.account_sid + '/Messages.json', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(config.twilio.account_sid + ':' + config.twilio.auth_token),
            },
            body: new URLSearchParams({
                'To': "+" + to,
                'From': "+" + config.twilio.from_number_text,
                'Body': message
            })
        });
    } catch {
        console.log('error sending text')
    }
}

/** */
export async function sendWhatsappMessage(to: string, message: string, config: any) {
    console.log(to, message, config.twilio.account_sid, config.twilio.auth_token, config.twilio.from_number_whatsapp)
    try {
        fetch('https://api.twilio.com/2010-04-01/Accounts/' + config.twilio.account_sid + '/Messages.json', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(config.twilio.account_sid + ':' + config.twilio.auth_token),
            },
            body: new URLSearchParams({
                'To':'whatsapp:+' + to,
                'From': 'whatsapp:+' + config.twilio.from_number_whatsapp,
                'Body': message
            })
        });
    } catch {
        console.log('error sending Whatsapp message')
    }
}


/** */
export async function sendEmail(to: string, message: string, config: any) {
    try {
        const form = new FormData();
        form.append('from', 'Excited User <' + config.mailgun.email_address + '>');
        form.append('to', config.mailgun.email_address);
        form.append('to', to);
        form.append('subject', 'New message');
        form.append('text', message);

        fetch('https://api.mailgun.net/v3/' + config.mailgun.domain + '/messages', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(config.mailgun.auth_token)
            },
            body: form
        });
    } catch {
        console.log('error sending email')
    }
}
