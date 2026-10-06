import {Config} from '@remotion/cli/config';
import dns from 'node:dns';

// WSL sem rota IPv6: sem isto o download do Chrome headless falha com ENETUNREACH.
dns.setDefaultResultOrder('ipv4first');

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
// Vídeos longos e muitos frames de SVG: limite a concorrência para não travar a máquina.
Config.setConcurrency(4);
