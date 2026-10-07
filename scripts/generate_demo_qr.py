import os
import subprocess
import sys

# Step 1: Ensure 'qrcode' package is installed for generating QR images
try:
    import qrcode
except ImportError:
    print("Installing 'qrcode' library...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "qrcode[pil]"])
    import qrcode

def generate_qr(name, data, folder):
    filepath = os.path.join(folder, name)
    print(f"Generating QR code for data: '{data}' -> {filepath}")
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(filepath)

if __name__ == "__main__":
    demo_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "demo_assets")
    os.makedirs(demo_dir, exist_ok=True)
    
    print(f"Creating demo assets inside: {demo_dir}")
    
    # 1. Safe URL
    generate_qr("safe_url_qr.png", "https://google.com", demo_dir)
    
    # 2. Phishing URL
    generate_qr("phishing_url_qr.png", "http://secure-sbi-netbanking-verify.xyz/login", demo_dir)
    
    # 3. Safe UPI Payment
    generate_qr("safe_upi_qr.png", "upi://pay?pa=localstore@oksbi&pn=Supermarket&am=150", demo_dir)
    
    # 4. Scam UPI Payment
    generate_qr("scam_upi_qr.png", "upi://pay?pa=winprize@ybl&pn=LotteryHeadquarters&am=9999&tn=KBC_Prize_Registration", demo_dir)
    
    print("\nDemo QR codes generated successfully!")
    print("You can locate them in the 'demo_assets' folder at the root of your project.")
