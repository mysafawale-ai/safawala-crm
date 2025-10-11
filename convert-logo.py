#!/usr/bin/env python3
"""Convert SVG logo to high-quality PNG"""

import subprocess
import sys
import os

def check_brew_packages():
    """Check if required packages are installed"""
    try:
        # Check for cairosvg via pip
        import cairosvg
        return True
    except ImportError:
        print("Installing cairosvg...")
        subprocess.run([sys.executable, "-m", "pip", "install", "cairosvg", "pillow"], check=False)
        try:
            import cairosvg
            return True
        except ImportError:
            return False

def convert_svg_to_png():
    """Convert SVG to high-quality PNG"""
    try:
        import cairosvg
        from PIL import Image
        import io
        
        svg_path = './public/safalogo.svg'
        png_path = './public/safalogo.png'
        
        # Convert SVG to PNG at high resolution
        # Using scale=3 for 3x resolution (retina display)
        png_data = cairosvg.svg2png(
            url=svg_path,
            output_width=1800,  # High resolution
            output_height=600,
            scale=3.0
        )
        
        # Open with PIL for additional optimization
        img = Image.open(io.BytesIO(png_data))
        
        # Convert to RGB if needed
        if img.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[3])
            else:
                background.paste(img, mask=img.split()[1])
            img = background
        
        # Save with high quality
        img.save(png_path, 'PNG', optimize=True, quality=100)
        
        file_size = os.path.getsize(png_path) / 1024
        print(f"✅ Logo converted successfully!")
        print(f"📁 Output: {png_path}")
        print(f"📐 Size: {img.width}x{img.height}px")
        print(f"💾 File size: {file_size:.1f} KB")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Trying alternative method...")
        
        # Fallback: Use qlmanage (macOS Quick Look) to render
        try:
            subprocess.run([
                'qlmanage', '-t', '-s', '1800', '-o', './public/',
                './public/safalogo.svg'
            ], check=True)
            print("✅ Converted using Quick Look")
        except:
            print("❌ Could not convert. Please use online converter.")

if __name__ == '__main__':
    if check_brew_packages():
        convert_svg_to_png()
    else:
        print("❌ Could not install required packages")
        print("Please run: pip3 install cairosvg pillow")
