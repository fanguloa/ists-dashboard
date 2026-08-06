import type { APIRoute } from 'astro';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { editor, path } = body;

    if (!editor || !path) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let command = '';

    switch (editor) {
      case 'opencode':
        // OpenCode CLI
        command = `opencode "${path}"`;
        break;
      case 'vscode':
        // VSCode CLI
        command = `code "${path}"`;
        break;
      case 'terminal':
        // Abrir terminal en Windows
        command = `start cmd /K "cd /d ${path}"`;
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Editor no soportado' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
    }

    // Ejecutar comando en segundo plano (no esperar respuesta)
    exec(command, (error) => {
      if (error) {
        console.error(`Error ejecutando ${editor}:`, error);
      }
    });

    return new Response(
      JSON.stringify({ success: true, message: `Abriendo ${editor}...` }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error abriendo editor:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
