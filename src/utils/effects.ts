import { Monster } from './monsters';

export function drawMonsterEffect(
  ctx: CanvasRenderingContext2D,
  monster: Monster,
  box: any,
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height);
  if (!box) return;

  const xCenter = box.xCenter * width;
  const yCenter = box.yCenter * height;
  const faceWidth = box.width * width;
  const faceHeight = box.height * height;

  // 绘制光环
  if (monster.features.halo) {
    const gradient = ctx.createRadialGradient(
      xCenter, yCenter, 0,
      xCenter, yCenter, faceWidth * 1.5
    );
    gradient.addColorStop(0, `${monster.color}40`);
    gradient.addColorStop(0.5, `${monster.color}20`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(xCenter, yCenter, faceWidth * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 绘制角
  if (monster.features.horns) {
    ctx.fillStyle = monster.color;
    ctx.strokeStyle = monster.color;
    ctx.lineWidth = 2;

    // 左角
    ctx.beginPath();
    ctx.moveTo(xCenter - faceWidth * 0.3, yCenter - faceHeight * 0.4);
    ctx.lineTo(xCenter - faceWidth * 0.4, yCenter - faceHeight * 0.9);
    ctx.lineTo(xCenter - faceWidth * 0.2, yCenter - faceHeight * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 右角
    ctx.beginPath();
    ctx.moveTo(xCenter + faceWidth * 0.3, yCenter - faceHeight * 0.4);
    ctx.lineTo(xCenter + faceWidth * 0.4, yCenter - faceHeight * 0.9);
    ctx.lineTo(xCenter + faceWidth * 0.2, yCenter - faceHeight * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 绘制翅膀
  if (monster.features.wings) {
    ctx.fillStyle = `${monster.color}80`;

    // 左翅膀
    ctx.beginPath();
    ctx.ellipse(
      xCenter - faceWidth * 0.8,
      yCenter,
      faceWidth * 0.6,
      faceHeight * 0.5,
      -0.3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 右翅膀
    ctx.beginPath();
    ctx.ellipse(
      xCenter + faceWidth * 0.8,
      yCenter,
      faceWidth * 0.6,
      faceHeight * 0.5,
      0.3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // 绘制火焰
  if (monster.features.fire) {
    ctx.fillStyle = monster.color;
    for (let i = 0; i < 5; i++) {
      const flameX = xCenter - faceWidth * 0.3 + i * faceWidth * 0.15;
      const flameY = yCenter - faceHeight * 1.1;
      ctx.beginPath();
      ctx.moveTo(flameX, flameY);
      ctx.lineTo(flameX - faceWidth * 0.05, flameY - faceHeight * 0.3);
      ctx.lineTo(flameX + faceWidth * 0.05, flameY - faceHeight * 0.3);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 绘制獠牙
  if (monster.features.fangs) {
    ctx.fillStyle = '#f0f0f0';
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;

    // 左獠牙
    ctx.beginPath();
    ctx.moveTo(xCenter - faceWidth * 0.15, yCenter + faceHeight * 0.15);
    ctx.lineTo(xCenter - faceWidth * 0.18, yCenter + faceHeight * 0.35);
    ctx.lineTo(xCenter - faceWidth * 0.12, yCenter + faceHeight * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 右獠牙
    ctx.beginPath();
    ctx.moveTo(xCenter + faceWidth * 0.15, yCenter + faceHeight * 0.15);
    ctx.lineTo(xCenter + faceWidth * 0.18, yCenter + faceHeight * 0.35);
    ctx.lineTo(xCenter + faceWidth * 0.12, yCenter + faceHeight * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 绘制发光眼睛
  if (monster.features.glowingEyes) {
    const glow = ctx.createRadialGradient(
      xCenter, yCenter, 0,
      xCenter, yCenter, faceWidth * 0.5
    );
    glow.addColorStop(0, `${monster.color}60`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(xCenter, yCenter, faceWidth * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}