import paramiko
import sys

host = '37.1.197.100'
user = 'root'
password = 'GLM2ETatD6'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, username=user, password=password, timeout=10)
    print("SUCCESS")
except paramiko.ssh_exception.AuthenticationException:
    print("AUTH_FAILED")
except Exception as e:
    print(f"FAILED: {e}")
finally:
    client.close()
