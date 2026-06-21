# make_videos_v3.py — PIL-based with proper visual design
import subprocess, os, math
from PIL import Image, ImageDraw

W, H = 1920, 1080
FPS = 30
DUR = 8
OUT = 'videos'
os.makedirs(OUT, exist_ok=True)

BG = '#0a0a12'
CARD_BG = '#111118'
ACCENT = '#667eea'
GREEN = '#4ade80'
ORANGE = '#f0883e'

def gradient(draw, x1, y1, x2, y2, c1, c2):
    """Draw a vertical/horizontal gradient"""
    if x1 == x2:  # vertical
        for y in range(y1, y2):
            t = (y - y1) / (y2 - y1)
            r = int(int(c1[1:3], 16) * (1-t) + int(c2[1:3], 16) * t)
            g = int(int(c1[3:5], 16) * (1-t) + int(c2[3:5], 16) * t)
            b = int(int(c1[5:7], 16) * (1-t) + int(c2[5:7], 16) * t)
            draw.line([(x1, y), (x2, y)], fill=(r, g, b))

def create_vid1_lidar():
    """LiDAR construction inspection"""
    tmp = '/tmp/v1_frames'
    os.makedirs(tmp, exist_ok=True)
    total = FPS * DUR  # 240

    for i in range(total):
        t = i / total
        img = Image.new('RGB', (W, H), BG)
        d = ImageDraw.Draw(img)

        # Background grid (subtle)
        for gx in range(0, W, 60):
            d.line([(gx, 0), (gx, H)], fill=(18, 18, 28), width=1)
        for gy in range(0, H, 60):
            d.line([(0, gy), (W, gy)], fill=(18, 18, 28), width=1)

        # Isometric building - 6 floors appear one by one
        bx, by = 300, 700
        floors = 6
        fh, fw, fd = 40, 300, 180
        for f in range(floors):
            fy = by - (f + 1) * fh
            appear = t * (floors + 1) - f
            alpha = max(0, min(1, appear))

            if alpha > 0.05:
                # Floor block
                color = (26, 58, 42) if appear > 1 else (58, 42, 26)
                pts_top = [(bx, fy), (bx+fw, fy-fh//2), (bx+fw, fy-fh//2-fd), (bx, fy-fd)]
                pts_side = [(bx+fw, fy-fh//2), (bx+fw, fy), (bx, fy), (bx, fy-fd)]

                alpha_int = int(alpha * 200) if appear <= 1 else 200
                d.polygon(pts_top, fill=color + (alpha_int,))
                d.polygon(pts_side, fill=(color[0]-5, color[1]-5, color[2]-5, alpha_int))

                # Wireframe edges
                edge_color = (74, 106, 154, int(alpha * 120))
                d.line([(bx, fy), (bx+fw, fy-fh//2)], fill=edge_color, width=1)
                d.line([(bx+fw, fy-fh//2), (bx+fw, fy-fh//2-fd)], fill=edge_color, width=1)
                d.line([(bx+fw, fy-fh//2-fd), (bx, fy-fd)], fill=edge_color, width=1)
                d.line([(bx, fy-fd), (bx, fy)], fill=edge_color, width=1)

        # LiDAR scanner
        sx = W // 2 + int(150 * math.cos(t * 2.5))
        sy = H // 2 + int(60 * math.sin(t * 0.6))
        d.ellipse([sx-15, sy-15, sx+15, sy+15], fill=(102, 126, 234), outline=(136, 155, 255))
        # Rotating ring
        ring_r = 22 + int(6 * math.sin(t * 8))
        for j in range(4):
            angle = t * 6 + j * math.pi / 2
            rx = sx + int(ring_r * math.cos(angle))
            ry = sy + int(ring_r * math.sin(angle))
            d.ellipse([rx-4, ry-4, rx+4, ry+4], fill=(136, 155, 255))

        # Laser beams
        for j in range(8):
            ba = t * 4 + j * math.pi / 4
            bl = 40 + int(25 * math.sin(t * 10 + j))
            ex = sx + int(bl * math.cos(ba))
            ey = sy + int(bl * math.sin(ba))
            alpha = int(100 * (0.3 + 0.3 * math.sin(t * 12 + j)))
            d.line([(sx, sy), (ex, ey)], fill=(255, 77, 77, min(255, alpha)), width=1)

        # Point cloud
        import random
        rng = random.Random(int(t * 1000))
        for _ in range(80):
            px = int(400 + 350 * rng.random())
            py = int(300 + 400 * rng.random())
            a = int(60 * min(1, t * 3) * (0.5 + 0.5 * rng.random()))
            d.ellipse([px-2, py-2, px+2, py+2], fill=(102, 126, 234, min(255, a)))

        # Bottom info bar
        d.rectangle([0, H-120, W, H], fill=(10, 10, 18, 180))
        d.text((W//2 - 120, H-90), 'LiDAR 光打施工查驗', fill='white', font_size=44)
        d.text((W//2 - 100, H-40), 'Scan → Verify → Build with Confidence', fill=(136, 155, 187), font_size=20)

        # Frame counter
        progress = f'{i+1}/{total}'
        d.text((W-200, 20), progress, fill=(136, 155, 255), font_size=14)

        img.save(f'{tmp}/frame_{i:04d}.png')
        if i % 60 == 0:
            print(f'  V1 frame {i}/{total}')

    print('  Encoding V1...')
    subprocess.run([
        'ffmpeg', '-y', '-framerate', str(FPS),
        '-i', f'{tmp}/frame_%04d.png',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20',
        f'{OUT}/lidar_inspection.mp4'
    ], capture_output=True)
    print(f'  ✅ lidar_inspection.mp4 ({os.path.getsize(f"{OUT}/lidar_inspection.mp4")/1024:.0f} KB)')
    # Cleanup
    for f in os.listdir(tmp): os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)


def create_vid2_payment():
    """4D Payment Progress"""
    tmp = '/tmp/v2_frames'
    os.makedirs(tmp, exist_ok=True)
    total = FPS * DUR

    milestones = [
        ('基礎完成', 0.15, '🏗️'),
        ('結構封頂', 0.30, '🏢'),
        ('外牆完成', 0.50, '🧱'),
        ('內裝進行', 0.70, '🔧'),
        ('景觀工程', 0.85, '🌳'),
        ('最終交屋', 1.00, '🔑')
    ]

    for i in range(total):
        t = i / total
        img = Image.new('RGB', (W, H), BG)
        d = ImageDraw.Draw(img)

        # Grid bg
        for gx in range(0, W, 60):
            d.line([(gx, 0), (gx, H)], fill=(18, 18, 28), width=1)

        # === LEFT: Building ===
        lx, lw = 60, 1000  # panel width
        bx, by = 120, H - 150
        bw, bh = lw - 100, H - 280

        d.rectangle([bx, by-bh, bx+bw, by], fill=(17, 17, 24), outline=(42, 42, 58))
        floors = 6
        fh = bh // (floors + 1)
        current = math.floor(t * floors * 1.05)

        for f in range(floors):
            fy = by - (f + 1) * fh
            if f < current:
                color = (26, 58, 42)
                icon = '✓'
                ic = GREEN[1:]
            elif f == current:
                color = (58, 42, 26)
                icon = '⏳'
                ic = ORANGE[1:]
            else:
                color = (26, 26, 40)
                icon = ''
                ic = '333333'

            r = int(color[0]); g = int(color[1]); b = int(color[2])
            d.rectangle([bx, fy, bx+bw, fy+fh-4], fill=(r, g, b))
            if icon:
                d.text((bx+20, fy+fh//2-8), icon, fill=f'#{ic}', font_size=18)

        d.rectangle([bx, by-bh, bx+bw, by], outline=(58, 74, 106), width=2)

        # === RIGHT: Dashboard ===
        rx, ry = lx + lw + 20, 80
        rw, rh = W - rx - 40, H - 160

        d.rectangle([rx, ry, rx+rw, ry+rh], fill=(10, 10, 20, 240), outline=(102, 126, 234, 50))
        d.text((rx+30, ry+30), '4D 付款進度比對', fill='white', font_size=36)
        d.text((rx+30, ry+72), '買房子不再買盲盒 — BIM 模型驗證每一塊錢的進度', fill=(136, 155, 187), font_size=18)

        # Milestones
        for mi, (name, pct, icon) in enumerate(milestones):
            my = ry + 150 + mi * 85
            done = t > pct
            cur = not done and (mi == 0 or t > milestones[mi-1][1])
            color = (74, 222, 128) if done else (240, 136, 62) if cur else (51, 51, 51)

            d.ellipse([rx+55, my+5, rx+65, my+15], fill=color)
            if done:
                d.text((rx+58, my+3), '✓', fill='white', font_size=10)

            txt_color = '#cccccc' if done else '#f0883e' if cur else '#555555'
            d.text((rx+85, my), name, fill=txt_color, font_size=21)

            # Progress bar
            bar_w = rw - 170
            d.rectangle([rx+85, my+28, rx+85+bar_w, my+36], fill=(26, 26, 42))
            if done:
                d.rectangle([rx+85, my+28, rx+85+bar_w, my+36], fill=(74, 222, 128))
            elif cur and mi > 0:
                prev_pct = milestones[mi-1][1]
                p = (t - prev_pct) / (pct - prev_pct)
                d.rectangle([rx+85, my+28, rx+85+int(bar_w*p), my+36], fill=(240, 136, 62))

        # Total progress
        py = ry + rh - 90
        d.text((rx+30, py), '總付款進度', fill='white', font_size=18)
        d.rectangle([rx+30, py+25, rx+rw-70, py+45], fill=(26, 26, 42))
        d.rectangle([rx+30, py+25, rx+30+int((rw-100)*t), py+45], fill=(74, 222, 128))
        d.text((rx+rw-60, py+30), f'{t*100:.0f}%', fill='white', font_size=16)

        if t > 0.98:
            d.rectangle([rx+30, py-20, rx+rw-70, py], fill=(74, 222, 128, 38))
            d.text((rx+rw//2-80, py-18), '✅ 所有進度已通過 BIM 模型驗證', fill='#4ade80', font_size=16)

        # Frame counter
        d.text((W-200, 20), f'{i+1}/{total}', fill=(136, 155, 255), font_size=14)

        img.save(f'{tmp}/frame_{i:04d}.png')
        if i % 60 == 0:
            print(f'  V2 frame {i}/{total}')

    print('  Encoding V2...')
    subprocess.run([
        'ffmpeg', '-y', '-framerate', str(FPS),
        '-i', f'{tmp}/frame_%04d.png',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20',
        f'{OUT}/payment_progress.mp4'
    ], capture_output=True)
    print(f'  ✅ payment_progress.mp4 ({os.path.getsize(f"{OUT}/payment_progress.mp4")/1024:.0f} KB)')
    for f in os.listdir(tmp): os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)


def create_vid3_ar():
    """AR/MR Handover Inspection"""
    tmp = '/tmp/v3_frames'
    os.makedirs(tmp, exist_ok=True)
    total = FPS * DUR
    rng = __import__('random')

    checks = [
        ('管線位置比對', 0.20, True),
        ('插座高度檢查', 0.35, True),
        ('牆面平整度', 0.50, True),
        ('門窗尺寸', 0.99, False),
        ('結構安全檢測', 0.75, True)
    ]

    for i in range(total):
        t = i / total
        img = Image.new('RGB', (W, H), BG)
        d = ImageDraw.Draw(img)

        # Grid
        for gx in range(0, W, 60):
            d.line([(gx, 0), (gx, H)], fill=(18, 18, 28), width=1)

        # Room (perspective sketch)
        cx, cy = W//2 - 300, H//2 + 20
        rw, rh = 480, 340

        # Back wall
        d.rectangle([cx-rw//2, cy-rh-30, cx+rw//2, cy+rh-30], fill=(26, 26, 40), outline=(42, 42, 74))

        # BIM grid overlay
        for gx in range(cx-rw//2, cx+rw//2, 35):
            d.line([(gx, cy-rh-30), (gx, cy+rh-30)], fill=(102, 126, 234, 15), width=1)
        for gy in range(cy-rh-30, cy+rh-30, 35):
            d.line([(cx-rw//2, gy), (cx+rw//2, gy)], fill=(102, 126, 234, 15), width=1)

        # Side walls
        d.polygon([
            (cx-rw//2, cy-rh-30), (cx-rw//2-70, cy-rh),
            (cx-rw//2-70, cy+rh), (cx-rw//2, cy+rh-30)
        ], fill=(21, 21, 32))
        d.polygon([
            (cx+rw//2, cy-rh-30), (cx+rw//2+70, cy-rh),
            (cx+rw//2+70, cy+rh), (cx+rw//2, cy+rh-30)
        ], fill=(21, 21, 32))

        # Floor
        d.polygon([
            (cx-rw//2, cy+rh-30), (cx+rw//2, cy+rh-30),
            (cx+rw//2+50, cy+rh+20), (cx-rw//2-50, cy+rh+20)
        ], fill=(18, 18, 24))

        # Scanning line
        sy = cy - rh - 30 + int((t * 800) % (rh * 2 + 100))
        d.rectangle([cx-rw//2, sy-12, cx+rw//2, sy+12], fill=(102, 126, 234, 12))

        # BIM measurement labels
        for j in range(3):
            lx = cx - rw//2 + 120 + j * 130
            ly = cy - rh//2 + int(20 * math.sin(t * 4 + j * 2))
            d.rectangle([lx-25, ly-12, lx+25, ly+12], fill=(10, 10, 18, 200), outline=(102, 126, 234, 100))
            d.text((lx-22, ly-8), f'{2500+j*120}mm', fill=(136, 155, 255), font_size=11)

        # HUD top bar
        tabs = ['BIM 疊加層', '即時偏差', '驗收記錄']
        for ti, tab in enumerate(tabs):
            tx = W//2 + (ti - 1) * 160
            active = ti == 0
            d.rectangle([tx-70, 12, tx+70, 48], fill=(10, 10, 20, 200),
                       outline=(102, 126, 234, 120) if active else (102, 126, 234, 30))
            d.text((tx-55, 22), tab, fill='white' if active else (102, 126, 234), font_size=15)

        # Checklist (right)
        clx, cly = W - 520, H//2 - 180
        d.rectangle([clx, cly, clx+320, cly+280], fill=(10, 10, 20, 220), outline=(102, 126, 234, 40))
        d.text((clx+15, cly+15), 'AR 交屋驗收清單', fill='white', font_size=18)

        for ci, (name, pct, passes) in enumerate(checks):
            iy = cly + 55 + ci * 42
            passed = t > pct
            icon = '✓' if (passed and passes) or (passed and not passes) else '⚠'
            color = (74, 222, 128) if passed and passes else (255, 77, 77) if passed and not passes else (51, 51, 51)
            txt_color = '#cccccc' if passed and passes else '#ff8888' if passed and not passes else '#555555'

            d.ellipse([clx+18, iy+2, clx+30, iy+14], fill=color)
            if passed:
                d.text((clx+22, iy), icon, fill='white', font_size=10)
            d.text((clx+45, iy-2), name, fill=txt_color, font_size=16)

        # Bottom title
        d.text((W//2-140, H-90), 'AR / MR 交屋驗收比對', fill='white', font_size=40)
        d.text((W//2-110, H-42), '不是你驗收，是 BIM 幫你驗收', fill=(136, 155, 187), font_size=20)

        d.text((W-200, 20), f'{i+1}/{total}', fill=(136, 155, 255), font_size=14)

        img.save(f'{tmp}/frame_{i:04d}.png')
        if i % 60 == 0:
            print(f'  V3 frame {i}/{total}')

    print('  Encoding V3...')
    subprocess.run([
        'ffmpeg', '-y', '-framerate', str(FPS),
        '-i', f'{tmp}/frame_%04d.png',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20',
        f'{OUT}/ar_handover.mp4'
    ], capture_output=True)
    print(f'  ✅ ar_handover.mp4 ({os.path.getsize(f"{OUT}/ar_handover.mp4")/1024:.0f} KB)')
    for f in os.listdir(tmp): os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)


print('🎬 Creating videos with Python PIL...\n')
create_vid1_lidar()
create_vid2_payment()
create_vid3_ar()
print('\n✅ All 3 videos done!')
