import zlib
import struct
import math
import os

def create_png(width, height, draw_func, filename):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # filter type 0 (None)
        for x in range(width):
            r, g, b, a = draw_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
            
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # IDAT chunk
    compressed = zlib.compress(bytes(raw_data), 9)
    idat_crc = zlib.crc32(b'IDAT' + compressed) & 0xffffffff
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND') & 0xffffffff
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(png)
    print(f"Created {filename} ({width}x{height})")

def fox_icon_drawer(x, y, w, h):
    # Normalized coords from -1.0 to 1.0
    nx = (x / w) * 2.0 - 1.0
    ny = (y / h) * 2.0 - 1.0
    
    # Background rounded squircle
    r_corner = 0.82
    dist_box = (abs(nx)**4 + abs(ny)**4)**0.25
    if dist_box > 0.96:
        return 0, 0, 0, 0 # transparent outer corner
    
    # Dark graphite automotive background gradient
    grad = 0.5 + 0.5 * (nx * 0.3 + ny * 0.7)
    bg_r = int(18 + 10 * grad)
    bg_g = int(18 + 10 * grad)
    bg_b = int(22 + 12 * grad)
    
    # Thin orange border near edge
    if 0.90 <= dist_box <= 0.95:
        return 255, 107, 0, 240
        
    # Geometric Fox Head
    # Center brow / nose tip at (0, 0.45)
    # Ears: left ear tip (-0.5, -0.65), right ear tip (0.5, -0.65)
    # Forehead center (0, -0.35)
    # Eyes around (-0.22, 0.0) and (0.22, 0.0)
    
    # Check if point is inside fox ears/face
    # Left ear triangle: (-0.5, -0.65) to (-0.15, -0.2) to (-0.45, -0.15)
    # Right ear triangle: (0.5, -0.65) to (0.15, -0.2) to (0.45, -0.15)
    in_left_ear = False
    in_right_ear = False
    
    # Simple polygon inclusion or distance approximation
    # Ear regions
    if -0.55 <= nx <= -0.1 and -0.7 <= ny <= -0.1:
        slope1 = (ny - (-0.65)) - (1.3 * (nx - (-0.5)))
        slope2 = (ny - (-0.65)) - (-1.4 * (nx - (-0.5)))
        if ny > -0.65 and nx < -0.15 and abs(nx + 0.35) * 1.5 - (ny + 0.4) < 0.35:
            in_left_ear = True
            
    if 0.1 <= nx <= 0.55 and -0.7 <= ny <= -0.1:
        if ny > -0.65 and nx > 0.15 and abs(nx - 0.35) * 1.5 - (ny + 0.4) < 0.35:
            in_right_ear = True
            
    # Face diamond: center at (0, 0.05), width 0.75, height 0.85
    face_d = abs(nx) * 1.4 + abs(ny - 0.05) * 1.1
    in_face = face_d < 0.72 and ny < 0.48 and ny > -0.45
    
    # Snout point
    in_snout = abs(nx) * 2.2 + (ny - 0.15) * 1.8 < 0.8 and ny >= 0.15 and ny <= 0.52
    
    # Orange fox coloring
    if in_left_ear or in_right_ear or in_face or in_snout:
        # Cheeks highlight
        if ny > 0.1 and abs(nx) > 0.22 and not in_snout:
            # White cheek accent
            return 240, 240, 245, 255
            
        # Eyes
        if abs(ny - (-0.02)) < 0.06 and (0.12 < abs(nx) < 0.28):
            # Glowing amber eyes
            return 255, 185, 0, 255
            
        # Black nose tip
        if ny > 0.46 and abs(nx) < 0.09:
            return 18, 18, 20, 255
            
        # Vibrant automotive orange gradient
        orange_grad = 0.5 + 0.5 * ny
        r = 255
        g = int(105 - 35 * orange_grad)
        b = int(0)
        return r, g, b, 255
        
    # Polishing diamond flare below
    flare_d = abs(nx) * 2.5 + abs(ny - 0.68) * 2.5
    if flare_d < 0.14:
        return 255, 120, 0, 255
        
    return bg_r, bg_g, bg_b, 255

os.makedirs('public', exist_ok=True)
create_png(192, 192, fox_icon_drawer, 'public/pwa-192x192.png')
create_png(512, 512, fox_icon_drawer, 'public/pwa-512x512.png')
create_png(512, 512, fox_icon_drawer, 'public/pwa-maskable-512x512.png')
create_png(180, 180, fox_icon_drawer, 'public/apple-touch-icon.png')
create_png(64, 64, fox_icon_drawer, 'public/favicon.ico')
print("PWA icons generated successfully!")
