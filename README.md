# tuya-control

Controle de dispositivos Tuya (lampadas e smart home) via rede local, usando [TuyAPI](https://github.com/TuyaAPI/tuyapi).

## Requisitos

- Node.js 18+
- pnpm (recomendado) ou npm

## Instalacao

```bash
pnpm install
```

## Configuracao

1. Copie o arquivo de exemplo e edite com seus dispositivos:

```bash
cp devices.example.json devices.json
```

2. Preencha `devices.json` com cada dispositivo: `name`, `id`, `key`, `ip` e `version` (ex: `3.3`).

Para obter o `id` e a `key` do dispositivo, use a Tuya IoT Platform ou ferramentas como o [tuya-cli](https://github.com/TuyaAPI/tuyapi/blob/master/docs/SETUP.md).

## Descobrir dispositivos na rede

Listar dispositivos que respondem ao broadcast (mostra IP e ID):

```bash
pnpm run discover
```

Escutar broadcasts UDP na rede (15s):

```bash
node scan.mjs
```

## Uso

Controle um dispositivo (se houver apenas um em `devices.json`, o nome e opcional):

```bash
node control.mjs on
node control.mjs off
node control.mjs toggle
node control.mjs status
```

Com multiplos dispositivos, informe o nome ou o ID:

```bash
node control.mjs on "Luz Sala"
node control.mjs off "Luz Sala"
node control.mjs status "Luz Sala"
```

Variavel de ambiente opcional para usar outro arquivo de config:

```bash
TUYA_DEVICES_PATH=/caminho/para/meus-devices.json node control.mjs on
```

## Scripts

| Script       | Descricao                          |
|-------------|-------------------------------------|
| `pnpm run control` | Atalho para `node control.mjs` (passar args: on/off/toggle/status [device]) |
| `pnpm run discover` | Descobre dispositivos na rede (find) |

## Estrutura do devices.json

Array de objetos com:

- `name`: nome amigavel (opcional, usado no CLI)
- `id`: Device ID da Tuya
- `key`: Device Key (secreto)
- `ip`: IP local do dispositivo
- `version`: versao do protocolo (ex: `3.1`, `3.3`, `3.4`)

## Licenca

ISC
