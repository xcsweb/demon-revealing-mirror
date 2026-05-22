import { EffectType } from '@/types';

export function drawDemonEyes(
  ctx: CanvasRenderingContext2D,
  landmarks: any,
  width: number,
  height: number
) {
  // MediaPipe 关键点：索引 0 是右眼，1 是左眼
  const rightEye = landmarks[0];
  const leftEye = landmarks[1];
  
  // 绘制发光红色眼睛
  const drawEye = (x: number, y: number) => {
    // 外发光
    const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, width * 0.08);
    outerGlow.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
    outerGlow.addColorStop(0.5, 'rgba(255, 69, 0, 0.4)');
    outerGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(x, y, width * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // 内圈红色
    const innerCircle = ctx.createRadialGradient(x, y, 0, x, y, width * 0.03);
    innerCircle.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    innerCircle.addColorStop(0.4, 'rgba(255, 0, 0, 0.9)');
    innerCircle.addColorStop(1, 'rgba(100, 0, 0, 0.9)');
    ctx.fillStyle = innerCircle;
    ctx.beginPath();
    ctx.arc(x, y, width * 0.03, 0, Math.PI * 2);
    ctx.fill();
    
    // 瞳孔
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x, y, width * 0.015, 0, Math.PI * 2);
    ctx.fill();
  };
  
  drawEye(rightEye.x * width, rightEye.y * height);
  drawEye(leftEye.x * width, leftEye.y * height);
}

export function drawFangs(
  ctx: CanvasRenderingContext2D,
  landmarks: any,
  width: number,
  height: number
) {
  // MediaPipe 关键点：索引 3 是嘴巴中心
  const mouth = landmarks[3];
  const nose = landmarks[2];
  
  const mouthX = mouth.x * width;
  const mouthY = mouth.y * height;
  const noseY = nose.y * height;
  const faceHeight = mouthY - noseY;
  
  // 绘制獠牙
  ctx.fillStyle = '#f0f0f0';
  ctx.strokeStyle = '#a0a0a0';
  ctx.lineWidth = 2;
  
  // 左獠牙
  ctx.beginPath();
  ctx.moveTo(mouthX - faceHeight * 0.3, mouthY);
  ctx.lineTo(mouthX - faceHeight * 0.35, mouthY + faceHeight * 0.4);
  ctx.lineTo(mouthX - faceHeight * 0.25, mouthY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // 右獠牙
  ctx.beginPath();
  ctx.moveTo(mouthX + faceHeight * 0.3, mouthY);
  ctx.lineTo(mouthX + faceHeight * 0.35, mouthY + faceHeight * 0.4);
  ctx.lineTo(mouthX + faceHeight * 0.25, mouthY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export function drawHorns(
  ctx: CanvasRenderingContext2D,
  landmarks: any,
  width: number,
  height: number
) {
  const rightEar = landmarks[4];
  const leftEar = landmarks[5];
  const nose = landmarks[2];
  
  const faceHeight = (rightEar.y * height) - (nose.y * height);
  
  // 绘制恶魔角
  ctx.fillStyle = '#330000';
  ctx.strokeStyle = '#660000';
  ctx.lineWidth = 3;
  
  // 左角
  ctx.beginPath();
  ctx.moveTo(rightEar.x * width - faceHeight * 0.1, rightEar.y * height - faceHeight * 0.3);
  ctx.bezierCurveTo(
    rightEar.x * width - faceHeight * 0.3, rightEar.y * height - faceHeight * 0.9,
    rightEar.x * width - faceHeight * 0.5, rightEar.y * height - faceHeight * 0.6,
    rightEar.x * width - faceHeight * 0.15, rightEar.y * height - faceHeight * 1.1
  );
  ctx.bezierCurveTo(
    rightEar.x * width, rightEar.y * height - faceHeight * 0.7,
    rightEar.x * width + faceHeight * 0.1, rightEar.y * height - faceHeight * 0.5,
    rightEar.x * width - faceHeight * 0.1, rightEar.y * height - faceHeight * 0.3
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // 右角
  ctx.beginPath();
  ctx.moveTo(leftEar.x * width + faceHeight * 0.1, leftEar.y * height - faceHeight * 0.3);
  ctx.bezierCurveTo(
    leftEar.x * width + faceHeight * 0.3, leftEar.y * height - faceHeight * 0.9,
    leftEar.x * width + faceHeight * 0.5, leftEar.y * height - faceHeight * 0.6,
    leftEar.x * width + faceHeight * 0.15, leftEar.y * height - faceHeight * 1.1
  );
  ctx.bezierCurveTo(
    leftEar.x * width, leftEar.y * height - faceHeight * 0.7,
    leftEar.x * width - faceHeight * 0.1, leftEar.y * height - faceHeight * 0.5,
    leftEar.x * width + faceHeight * 0.1, leftEar.y * height - faceHeight * 0.3
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export function drawGhostEffect(
  ctx: CanvasRenderingContext2D,
  box: any,
  width: number,
  height: number
) {
  // 绘制半透明绿色遮罩
  ctx.fillStyle = 'rgba(0, 255, 100, 0.15)';
  ctx.fillRect(0, 0, width, height);
  
  // 在人脸周围绘制发光效果
  const x = box.xCenter * width;
  const y = box.yCenter * height;
  const w = box.width * width;
  const h = box.height * height;
  
  const glow = ctx.createRadialGradient(x, y, 0, x, y, Math.max(w, h));
  glow.addColorStop(0, 'rgba(0, 255, 100, 0.3)');
  glow.addColorStop(1, 'rgba(0, 255, 100, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(w, h), 0, Math.PI * 2);
  ctx.fill();
}

export function drawEffect(
  ctx: CanvasRenderingContext2D,
  effectType: EffectType,
  box: any,
  landmarks: any,
  width: number,
  height: number
) {
  // 清空画布
  ctx.clearRect(0, 0, width, height);
  
  if (!landmarks) return;
  
  switch (effectType) {
    case 'demon-eyes':
      drawDemonEyes(ctx, landmarks, width, height);
      break;
    case 'fangs':
      drawFangs(ctx, landmarks, width, height);
      break;
    case 'horns':
      drawHorns(ctx, landmarks, width, height);
      break;
    case 'full-demon':
      drawHorns(ctx, landmarks, width, height);
      drawDemonEyes(ctx, landmarks, width, height);
      drawFangs(ctx, landmarks, width, height);
      break;
    case 'ghost':
      drawGhostEffect(ctx, box, width, height);
      break;
    default:
      break;
  }
}
