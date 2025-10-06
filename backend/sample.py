from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64

# Generate new ECDSA key pair (P-256 curve, required for VAPID)
private_key = ec.generate_private_key(ec.SECP256R1())
public_key = private_key.public_key()

# Export private key in base64url
private_bytes = private_key.private_numbers().private_value.to_bytes(32, "big")
private_key_b64 = base64.urlsafe_b64encode(private_bytes).rstrip(b"=").decode("utf-8")

# Export public key in uncompressed form
public_bytes = public_key.public_bytes(
    serialization.Encoding.X962,
    serialization.PublicFormat.UncompressedPoint
)
public_key_b64 = base64.urlsafe_b64encode(public_bytes).rstrip(b"=").decode("utf-8")

print("Public Key:", public_key_b64)
print("Private Key:", private_key_b64)
