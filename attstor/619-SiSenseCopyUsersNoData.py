import time
import json
import urllib
import jwt
import requests
import qualipy.api.cloudshell_api as api

REST_API_TOKEN = ''  # located at yourserver/app/settings#/rest
SISENSE_BASE_URL = ''  # located at yourserver/app/settings#/rest

EMAIL = '' # Sisense Admin's Email
PASSWORD = '' # Sisense Admin Password (cleartext!)

# Local Debug
username = '' # CS admin username
password = '' # CS admin Password (cleartext!)
server = '' # server address
domain = '' # Domain 

session = api.CloudShellAPISession(server, username, password, domain)

# Create JWT token
def create_jwt_token():
    payload = {
        "iat": int(time.time())
    }

    shared_key = REST_API_TOKEN
    payload['email'] = EMAIL
    payload['password'] = PASSWORD

    jwt_string = jwt.encode(payload, shared_key)
    encoded_jwt = urllib.quote_plus(jwt_string)  # url-encode the jwt string

    return encoded_jwt


def send_request(url, http_method, params=None, payload=None):
    encoded_jwt = create_jwt_token()
    headers = {'x-api-key': encoded_jwt}

    if payload:
        headers['Content-Type'] = 'application/json'
    if http_method.upper() == 'GET':
        response = requests.get(url, params=params, headers=headers)
    elif http_method.upper() == 'POST':
        data = json.dumps(payload)
        response = requests.post(url, data=data, params=params, headers=headers)
    elif http_method.upper() == 'PUT':
        data = json.dumps(payload)
        response = requests.put(url, data=data, params=params, headers=headers)
    elif http_method.upper() == 'DELETE':
        response = requests.delete(url, headers=headers)
    return response

group_dict = {}
emailed_users = []
CS_users = session.GetAllUsersDetails()
for t in CS_users.Users:
    if t.Email:
        emailed_users.append(t)
    else:
        print "no email for {0}".format(t.Name)
for CS_user in emailed_users:
    for grp in CS_user.Groups:
        if grp.Name in group_dict.keys():
            pass
        else:
            group_dict[grp.Name] = list()
        group_dict[grp.Name].append(CS_user)

payload_users = []
for euser in emailed_users:
    # add user to SiSense
    user_email_url = SISENSE_BASE_URL + '/api/users/' + euser.Email
    user_name_url = SISENSE_BASE_URL + '/api/users/' + euser.Name
    bbb = send_request(user_email_url, 'GET')
    ccc = send_request(user_name_url, 'GET')
    if not bbb.ok and not ccc.ok:
        print ("adding user {0}".format(euser.Email))
        payload_users.append({'userName': euser.Name ,'email': euser.Email , 'hash': 'null'})
    else:
        print ("user {0} exists".format(euser.Email))
add_users_url = SISENSE_BASE_URL + '/api/users/'
fff = send_request(add_users_url, 'POST', payload=payload_users)
group_names = group_dict.keys()
for group_name in group_names:
    # add group to sisense
    exist_group_url = SISENSE_BASE_URL + '/api/groups/' + group_name
    vvv = send_request(exist_group_url, 'GET')
    if not vvv.ok:
        print ("adding group {0}".format(group_name))
        payload_add_group = [{'name': group_name}]
        url_add_group = SISENSE_BASE_URL + '/api/groups'
        r1 = send_request(url_add_group, 'POST', payload=payload_add_group)
    else:
        print ("group {0} exists".format(group_name))
    user_to_group_url = SISENSE_BASE_URL + '/api/groups/' + group_name + '/users'
    for u in group_dict.get(group_name):
        print('adding user {1} with the email {2} to the group {0}'.format(group_name, u.Name, u.Email))
        # add user to group
        user_to_group_payload = []
        user_email_url_2 = SISENSE_BASE_URL + '/api/users/' + u.Email
        user_name_url_2 = SISENSE_BASE_URL + '/api/users/' + u.Name
        tjtemail = send_request(user_email_url_2, 'GET')
        tjtname = send_request(user_name_url_2, 'GET')
        if tjtname.ok:
            user_to_group_payload.append(u.Name)
        else:
            user_to_group_payload.append(u.Email)
        r2 = send_request(user_to_group_url, 'POST', payload=user_to_group_payload)

pass

# get all users
# all_users_url = SISENSE_BASE_URL + '/api/users'
# users = send_request(all_users_url, 'GET')