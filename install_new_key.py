import os
import paramiko

# Configuration
host = '37.1.197.100'
user = 'root'
old_key_path = os.path.expanduser('~/.ssh/id_rsa')
old_key_passphrase = 'wildgoose'
new_key_pub_path = os.path.expanduser('~/.ssh/id_spellbook.pub')

print(f"Reading new public key from {new_key_pub_path}...")
with open(new_key_pub_path, 'r') as f:
    new_pub_key = f.read().strip()

print(f"Connecting to {host} using {old_key_path}...")
try:
    # Load the old key with passphrase
    k = paramiko.RSAKey.from_private_key_file(old_key_path, password=old_key_passphrase)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, pkey=k, timeout=10)
    
    print("Connection successful! Installing new key...")
    # Command to append the new key to authorized_keys and set permissions
    install_cmd = f"mkdir -p ~/.ssh && echo '{new_pub_key}' >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
    
    stdin, stdout, stderr = client.exec_command(install_cmd)
    exit_status = stdout.channel.recv_exit_status()
    
    if exit_status == 0:
        print("SUCCESS: New key installed safely.")
    else:
        print(f"ERROR: Installation failed with status {exit_status}")
        print(stderr.read().decode())
        
    client.close()
except Exception as e:
    print(f"FAILED: {e}")
