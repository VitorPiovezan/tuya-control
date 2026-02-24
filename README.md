# tuya-control

Controle de dispositivos Tuya (lampadas e smart home) via rede local, usando [TuyAPI](https://github.com/TuyaAPI/tuyapi).

## Requisitos

- Node.js 18+
- pnpm (recomendado) ou npm

## Instalacao

```bash
pnpm install
```

## Configurar Smart Life (obter ID e Key dos dispositivos)

Para controlar os dispositivos localmente e preciso obter o **Device ID** e a **Local Key** de cada um. O app Smart Life so mostra o ID; a key sai pela plataforma de desenvolvedor da Tuya.

### 1. Adicionar dispositivos no app

- Instale o [Smart Life](https://play.google.com/store/apps/details?id=com.tuya.smartlife) ou [Tuya Smart](https://play.google.com/store/apps/details?id=com.tuya.smart) e crie uma conta.
- Adicione todos os dispositivos Tuya pela propria app (Wi-Fi, etc.) e deixe-os na mesma rede que o PC onde vai rodar o `tuya-control`.

### 2. Criar projeto na Tuya IoT Platform

- Acesse [iot.tuya.com](https://iot.tuya.com/) e crie uma conta (e separada da conta do app).
- Vá em **Cloud** > **Development** > **Create Cloud Project**.
- Preencha nome e descricao; em **Development Method** escolha **Smart Home**; em **Data Center** selecione a regiao do seu pais (ex: Americas, Europe).
- Crie o projeto e, no wizard, clique em **Authorize**.
- Na lista de APIs, habilite: **Industry Basic Service**, **Smart Home Basic Service** e **Device Status Notification** (e outras que o wizard indicar). Confirme.

### 3. Vincular a conta do Smart Life ao projeto

- No projeto criado, abra **Devices** (ou **Link Tuya App Account**) > **Add App Account**.
- Aparecera um QR code. Abra o app **Smart Life** (ou Tuya Smart), em **Me** / **Perfil** procure opcao de vincular ou escanear QR do desenvolvedor, e escaneie o codigo.
- Confirme no app. Os dispositivos do app passam a aparecer no projeto na IoT Platform.

### 4. Ver Device ID e Local Key

- No projeto, vá em **All Devices** (ou **Devices**). Cada dispositivo aparece com **Device ID** (vem no formato longo, ex: `eb0f6b37d7653aede5syao`).
- O **Device ID** tambem pode ser visto no app: toque no dispositivo > icone de editar / engrenagem > **Device information**.
- A **Local Key** nao aparece no app. Ela e obtida pela API da Tuya:
  - No **Overview** do projeto voce tem **Access ID** (Client ID) e **Access Secret** (Client Secret).
  - Com esses dados, use a API [Get Device Information](https://developer.tuya.com/docs/cloud/device-info?id=K9g6rfntw87o0) (`GET /v1.0/devices/{device_id}`) para ler o campo `local_key` do dispositivo. Ferramentas como [Localtuya](https://xzetsubou.github.io/hass-localtuya/cloud_api/) ou scripts que chamem a OpenAPI da Tuya (com Client ID e Secret) fazem isso por voce.

### 5. Descobrir o IP e a versao do protocolo

- **IP**: use o **discover** deste projeto (veja abaixo) ou veja na sua rede (roteador, app do roteador, ou `node scan.mjs`).
- **Versao**: normalmente `3.3` ou `3.4`. Se der erro de conexao, teste `3.1`, `3.3`, `3.4` e `3.5` (o script `probe.mjs` testa varias versoes).

Resumo: **id** e **key** vêm da Tuya IoT Platform (apos vincular o Smart Life); **ip** e **version** pela rede e testes.

## Configuracao do projeto

1. Copie o arquivo de exemplo e edite com seus dispositivos:

```bash
cp devices.example.json devices.json
```

2. Preencha `devices.json` com cada dispositivo: `name`, `id`, `key`, `ip` e `version` (ex: `3.3`), usando os dados obtidos na seção **Configurar Smart Life**.

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
