/**
 * Programmatic helper to generate shape datasets for instant training testing.
 * Simulates a real noisy training dataset by applying random translations, rotations, and scalings.
 */

export function generateShapeDataUrl(
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'cross',
  index: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - fill white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 128, 128);

  // Set line styling
  ctx.strokeStyle = '#1e293b'; // deep dark blue-grey
  ctx.lineWidth = 4 + (index % 3); // varied line width
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Apply slight random variations based on index
  const scale = 0.75 + (index * 0.05) % 0.2; // 0.75 to 0.95
  const rotation = (((index * 13) % 45) - 22.5) * (Math.PI / 180); // -22.5 to 22.5 degrees
  const dx = ((index * 7) % 15) - 7.5; // -7.5 to 7.5 px
  const dy = ((index * 9) % 15) - 7.5; // -7.5 to 7.5 px

  // Center coordinate
  const cx = 64 + dx;
  const cy = 64 + dy;
  const r = 40 * scale;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  } else if (shape === 'square') {
    ctx.rect(-r, -r, r * 2, r * 2);
  } else if (shape === 'triangle') {
    ctx.moveTo(0, -r);
    ctx.lineTo(r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6));
    ctx.lineTo(-r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6));
    ctx.closePath();
  } else if (shape === 'star') {
    const spikes = 5;
    const outerRadius = r;
    const innerRadius = r * 0.4;
    let rot = (Math.PI / 2) * 3;
    let x = 0;
    let y = 0;
    const step = Math.PI / spikes;

    ctx.moveTo(0, -outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = Math.cos(rot) * outerRadius;
      y = Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = Math.cos(rot) * innerRadius;
      y = Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.closePath();
  } else if (shape === 'cross') {
    const size = r;
    const thickness = r * 0.35;
    ctx.rect(-thickness, -size, thickness * 2, size * 2);
    ctx.rect(-size, -thickness, size * 2, thickness * 2);
  }

  // Draw style - alternate between stroke and slightly filled for variety
  if (index % 3 === 0) {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)'; // soft green tint
    ctx.fill();
  } else if (index % 3 === 1) {
    ctx.fillStyle = 'rgba(37, 99, 235, 0.08)'; // soft blue tint
    ctx.fill();
  }
  ctx.stroke();

  ctx.restore();

  return canvas.toDataURL('image/png');
}

/**
 * Text classification preset example datasets
 */
export const TEXT_PRESETS = {
  sentiment: {
    name: 'Sentiment Analysis (Positive vs. Negative)',
    classes: [
      {
        name: 'Positive',
        examples: [
          'This is absolutely incredible! I love it so much.',
          'Amazing experience, the user interface is beautiful and extremely fast.',
          'Super happy with the performance of this system, highly recommended!',
          'Outstanding support, super friendly team and perfect results.',
          'Wow, this exceeds all my expectations, exceptional work!'
        ]
      },
      {
        name: 'Negative',
        examples: [
          'This is terrible. It keeps crashing and nothing works.',
          'Extremely disappointed with the results, it is very slow.',
          'Very bad UI, confusing navigation, and lacks basic documentation.',
          'Waste of time and money, totally broken features.',
          'I hate this, it is completely useless and frustrating.'
        ]
      }
    ]
  },
  urgency: {
    name: 'Customer Support (Urgent vs. Low Priority)',
    classes: [
      {
        name: 'Urgent',
        examples: [
          'CRITICAL ERROR: My production server is down and users cannot login!',
          'Emergency! Payment system is double-charging customers immediately.',
          'Help, I lost all my personal data and need database restore right now.',
          'URGENT - Security breach detected in main portal login.',
          'Cannot open my account, I have a major presentation in 10 minutes!'
        ]
      },
      {
        name: 'Low Priority',
        examples: [
          'Just a quick question, is there a dark mode setting anywhere?',
          'Feedback: I really like the green buttons, maybe add pink as an option.',
          'Where can I find the terms of service document?',
          'Feature request: Can you add a small timezone indicator next to the footer?',
          'Hi, just testing out the portal, looks great so far. No action needed.'
        ]
      }
    ]
  },
  topics: {
    name: 'Content Topics (Tech vs. Food/Cooking)',
    classes: [
      {
        name: 'Tech & Programming',
        examples: [
          'The latest updates in TypeScript 5.5 include major performance boosts.',
          'How do I configure Vite middleware inside an Express server?',
          'Git merge conflicts can be easily resolved using a proper visual merge tool.',
          'Exploring neural networks and natural language models using deep learning.',
          'A simple database query to fetch items sorted by their creation timestamps.'
        ]
      },
      {
        name: 'Food & Cooking',
        examples: [
          'This delicious chocolate chip cookie recipe is crispy on the outside.',
          'How long should I bake the sourdough bread to get a golden crust?',
          'Add a pinch of salt and fresh basil leaves to the tomato sauce.',
          'I cooked a slow-roasted garlic parmesan chicken breast for dinner.',
          'The secret to a perfectly creamy risotto is adding warm broth slowly.'
        ]
      }
    ]
  }
};
