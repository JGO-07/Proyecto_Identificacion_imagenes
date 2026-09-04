import { spawn } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

/** Si no existe `.env`, lo crea desde la plantilla para el entorno local. */
function ensureEnvFile(): void {
  const envPath = path.join(repoRoot, '.env');
  const examplePath = path.join(repoRoot, '.env.example');
  if (!existsSync(envPath)) {
    copyFileSync(examplePath, envPath);
    console.log('No se encontró .env; se creó una copia desde .env.example.');
  }
}

/** Ejecuta un comando npm y aborta con un error claro si falla. */
function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: repoRoot, stdio: 'inherit', shell: true });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`El comando \`${command} ${args.join(' ')}\` terminó con código ${code}.`),
        );
      }
    });
    child.on('error', reject);
  });
}

/** Levanta la app en foreground (npm run dev) y reenvía las señales para apagarla limpio. */
function startApp(): Promise<never> {
  return new Promise((resolve, reject) => {
    const dev = spawn('npm', ['run', 'dev'], { cwd: repoRoot, stdio: 'inherit', shell: true });
    let shuttingDown = false;

    const forward = (signal: NodeJS.Signals): void => {
      shuttingDown = true;
      if (!dev.killed) dev.kill(signal);
    };
    process.on('SIGINT', () => forward('SIGINT'));
    process.on('SIGTERM', () => forward('SIGTERM'));

    dev.on('exit', (code) => {
      // Un Ctrl+C/envío de señal no es un error real: se cierra de forma limpia.
      if (shuttingDown || code === 0 || code === null) {
        resolve();
      } else {
        reject(new Error(`npm run dev terminó con código ${code}.`));
      }
    });
    dev.on('error', reject);
  });
}

async function main(): Promise<void> {
  ensureEnvFile();
  console.log('Levantando infraestructura (MariaDB + MinIO) y esperando healthcheck...');
  await runCommand('docker', ['compose', 'up', '-d', '--wait']);
  console.log('Aplicando migraciones...');
  await runCommand('npm', ['run', 'db:migrate']);
  console.log('Ejecutando seeder idempotente...');
  await runCommand('npm', ['run', 'db:seed']);
  console.log('Arrancando la aplicación (API + frontend)...');
  await startApp();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
