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
  const scaleFactor = 1.0; // 可以调整特效大小的缩放系数

  // 绘制光环
  if (monster.features.halo) {
    const gradient = ctx.createRadialGradient(
      xCenter, yCenter, 0,
      xCenter, yCenter, faceWidth * 1.4 * scaleFactor
    );
    gradient.addColorStop(0, `${monster.color}40`);
    gradient.addColorStop(0.5, `${monster.color}20`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(xCenter, yCenter, faceWidth * 1.4 * scaleFactor, 0, Math.PI * 2);
    ctx.fill();
  }

  // 绘制角 - 调整到头部上方更准确的位置
  if (monster.features.horns) {
    ctx.fillStyle = monster.color;
    ctx.strokeStyle = monster.color;
    ctx.lineWidth = 2;

    // 左角
    ctx.beginPath();
    ctx.moveTo(xCenter - faceWidth * 0.25 * scaleFactor, yCenter - faceHeight * 0.35 * scaleFactor);
    ctx.lineTo(xCenter - faceWidth * 0.35 * scaleFactor, yCenter - faceHeight * 0.8 * scaleFactor);
    ctx.lineTo(xCenter - faceWidth * 0.15 * scaleFactor, yCenter - faceHeight * 0.35 * scaleFactor);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 右角
    ctx.beginPath();
    ctx.moveTo(xCenter + faceWidth * 0.25 * scaleFactor, yCenter - faceHeight * 0.35 * scaleFactor);
    ctx.lineTo(xCenter + faceWidth * 0.35 * scaleFactor, yCenter - faceHeight * 0.8 * scaleFactor);
    ctx.lineTo(xCenter + faceWidth * 0.15 * scaleFactor, yCenter - faceHeight * 0.35 * scaleFactor);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 绘制翅膀 - 调整到头部两侧
  if (monster.features.wings) {
    ctx.fillStyle = `${monster.color}80`;

    // 左翅膀
    ctx.beginPath();
    ctx.ellipse(
      xCenter - faceWidth * 0.7 * scaleFactor,
      yCenter - faceHeight * 0.1 * scaleFactor,
      faceWidth * 0.55 * scaleFactor,
      faceHeight * 0.45 * scaleFactor,
      -0.25,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 右翅膀
    ctx.beginPath();
    ctx.ellipse(
      xCenter + faceWidth * 0.7 * scaleFactor,
      yCenter - faceHeight * 0.1 * scaleFactor,
      faceWidth * 0.55 * scaleFactor,
      faceHeight * 0.45 * scaleFactor,
      0.25,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // 绘制火焰 - 调整到头部上方
  if (monster.features.fire) {
    ctx.fillStyle = monster.color;
    for (let i = 0; i < 5; i++) {
      const flameX = xCenter - faceWidth * 0.25 * scaleFactor + i * faceWidth * 0.125 * scaleFactor;
      const flameY = yCenter - faceHeight * 0.5 * scaleFactor;
      ctx.beginPath();
      ctx.moveTo(flameX, flameY);
      ctx.lineTo(flameX - faceWidth * 0.04 * scaleFactor, flameY - faceHeight * 0.25 * scaleFactor);
      ctx.lineTo(flameX + faceWidth * 0.04 * scaleFactor, flameY - faceHeight * 0.25 * scaleFactor);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 绘制獠牙 - 调整到嘴部位置
  if (monster.features.fangs) {
    ctx.fillStyle = '#f0f0f0';
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;

    // 左獠牙
    ctx.beginPath();
    ctx.moveTo(xCenter - faceWidth * 0.12 * scaleFactor, yCenter + faceHeight * 0.18 * scaleFactor);
    ctx.lineTo(xCenter - faceWidth * 0.15 * scaleFactor, yCenter + faceHeight * 0.38 * scaleFactor);
    ctx.lineTo(xCenter - faceWidth * 0.09 * scaleFactor, yCenter + faceHeight * 0.18 * scaleFactor);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 右獠牙
    ctx.beginPath();
    ctx.moveTo(xCenter + faceWidth * 0.12 * scaleFactor, yCenter + faceHeight * 0.18 * scaleFactor);
    ctx.lineTo(xCenter + faceWidth * 0.15 * scaleFactor, yCenter + faceHeight * 0.38 * scaleFactor);
    ctx.lineTo(xCenter + faceWidth * 0.09 * scaleFactor, yCenter + faceHeight * 0.18 * scaleFactor);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 绘制发光眼睛 - 聚焦在眼睛位置
  if (monster.features.glowingEyes) {
    // 左眼发光
    const leftEyeGlow = ctx.createRadialGradient(
      xCenter - faceWidth * 0.15 * scaleFactor, yCenter - faceHeight * 0.08 * scaleFactor, 0,
      xCenter - faceWidth * 0.15 * scaleFactor, yCenter - faceHeight * 0.08 * scaleFactor, faceWidth * 0.25 * scaleFactor
    );
    leftEyeGlow.addColorStop(0, `${monster.color}80`);
    leftEyeGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = leftEyeGlow;
    ctx.beginPath();
    ctx.arc(xCenter - faceWidth * 0.15 * scaleFactor, yCenter - faceHeight * 0.08 * scaleFactor, faceWidth * 0.25 * scaleFactor, 0, Math.PI * 2);
    ctx.fill();

    // 右眼发光
    const rightEyeGlow = ctx.createRadialGradient(
      xCenter + faceWidth * 0.15 * scaleFactor, yCenter - faceHeight * 0.08 * scaleFactor, 0,
      xCenter + faceWidth * 0.15 * scaleFactor, yCenter - faceHeight * 0.08 * scaleFactor, faceWidth * 0.25 * scaleFactor
    );
    rightEyeGlow.addColorStop(0, `${monster.color}80`);
    rightEyeGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = rightEyeGlow;
    ctx.beginPath();
    ctx.arc(xCenter + faceWidth * 0.15 * scaleFactor, yCenter - faceHeight * 0.08 * scaleFactor, faceWidth * 0.25 * scaleFactor, 0, Math.PI * 2);
    ctx.fill();
  }
}