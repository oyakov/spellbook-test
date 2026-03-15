import os
import paramiko
import traceback

keys = ['github-deploy-key', 'google_compute_engine', 'id_rsa', 'vps-id', 'vps_binance', 'vps_binance_145_223_70_118', 'vps_binance_trader']
ssh_dir = r"C:\Users\Cantor Dallocort\.ssh"
host = '37.1.197.100'

for key_name in keys:
    key_path = os.path.join(ssh_dir, key_name)
    k = None
    try:
        from cryptography.hazmat.primitives import serialization
        with open(key_path, 'rb') as key_file:
            private_key = serialization.load_ssh_private_key(key_file.read(), password=None)
        k = paramiko.RSAKey.from_private_key_file(key_path)
    except Exception as e:
        if "password" in str(e).lower() or "encrypted" in str(e).lower():
            print(f'{key_name} is password protected: {e}')
        # We also try ED25519 or others if RSA fails, but paramiko exceptions are often distinct.
        try:
            k = paramiko.Ed25519Key.from_private_key_file(key_path)
        except Exception as e2:
            pass

    if getattr(k, 'is_encrypted', False) and k.passphrase is None:
         print(f"{key_name} needs passphrase but we dont have one")
         continue
    if k is None:
        continue
        
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(host, username='root', pkey=k, timeout=2)
        print(f'SUCCESS with {key_name}!')
        stdin, stdout, stderr = client.exec_command('whoami')
        print(stdout.read().decode())
    except Exception as e: # Will get AuthException if it's the wrong key.
        print(f'Failed {key_name}: {e}')
    finally:
        client.close()
