import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function analyzeImage() {
  try {
    const zai = await ZAI.create();
    
    const imageBuffer = fs.readFileSync('/home/z/my-project/upload/Captura de pantalla 2026-04-07 a las 18.37.58.png');
    const base64Image = imageBuffer.toString('base64');
    
    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe exactamente qué se ve en esta captura de pantalla. Es una configuración SSH de hosting. Dime: 1) ¿Está activado o desactivado el SSH? 2) ¿Qué opciones/botones hay? 3) ¿Qué información del servidor se muestra? 4) ¿Cómo se activaría?'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      thinking: { type: 'disabled' }
    });
    
    console.log(response.choices[0]?.message?.content);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

analyzeImage();
