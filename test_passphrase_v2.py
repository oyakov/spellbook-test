import os
import paramiko

keys = ['github-deploy-key', 'google_compute_engine', 'id_rsa', 'vps-id', 'vps_binance', 'vps_binance_145_223_70_118', 'vps_binance_trader']
ssh_dir = r"C:\Users\Cantor Dallocort\.ssh"
host = '37.1.197.100'
passphrase = 'GLM2ETatD6'

for key_name in keys:
    key_path = os.path.join(ssh_dir, key_name)
    if not os.path.exists(key_path): continue
    
    try:
        # Try RSA
        k = paramiko.RSAKey.from_private_key_file(key_path, password=passphrase)
        print(f"Key {key_name} (RSA) unlocked!")
    except Exception:
        try:
            # Try Ed25519
            k = paramiko.Ed25519Key.from_private_key_file(key_path, password=passphrase)
            print(f"Key {key_name} (Ed25519) unlocked!")
        except Exception:
            # Try ECDSA
            try:
                k = paramiko.ECDSAKey.from_private_key_file(key_path, password=passphrase)
                print(f"Key {key_name} (ECDSA) unlocked!")
            except Exception:
                continue

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(host, username='root', pkey=k, timeout=5)
        print(f'SUCCESS with {key_name}!')
        client.close()
        break
    except Exception as e:
        print(f'Auth failed with {key_name}: {e}')
        client.close()
