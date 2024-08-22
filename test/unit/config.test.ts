import { getConfig } from '../../src/commands/config';
import { prepareFile } from './utils';

describe('getConfig', () => {
  const originalEnv = { ...process.env };
  function resetEnv(env: NodeJS.ProcessEnv) {
    Object.keys(process.env).forEach((key) => {
      if (!(key in env)) {
        delete process.env[key];
      } else {
        process.env[key] = env[key];
      }
    });
  }

  beforeEach(() => {
    resetEnv(originalEnv);
  });

  afterAll(() => {
    resetEnv(originalEnv);
  });

  it('return config values from the global config file', async () => {
    const configFile = await prepareFile(
      '.opencommit',
      `
OCO_OPENAI_API_KEY="sk-key"
OCO_ANTHROPIC_API_KEY="secret-key"
OCO_AZURE_API_KEY="azure-key"
OCO_GEMINI_API_KEY="gemini-key"
OCO_TOKENS_MAX_INPUT="8192"
OCO_TOKENS_MAX_OUTPUT="1000"
OCO_OPENAI_BASE_PATH="/openai/api"
OCO_DESCRIPTION="true"
OCO_EMOJI="true"
OCO_MODEL="gpt-4"
OCO_LANGUAGE="de"
OCO_MESSAGE_TEMPLATE_PLACEHOLDER="$m"
OCO_PROMPT_MODULE="@commitlint"
OCO_AI_PROVIDER="ollama"
OCO_GITPUSH="false"
OCO_ONE_LINE_COMMIT="true"
OCO_AZURE_ENDPOINT="https://dummy.openai.azure.com"
OCO_TEST_MOCK_TYPE="commit-message"
OCO_FLOWISE_ENDPOINT="http://flowise.endpoint"
OCO_FLOWISE_API_KEY="flowise-key"
OCO_BACKEND_ENDPOINT="localhost:8000"
OCO_BACKEND_PATH="api/generate"
OCO_VCS_ENGINE="git"
`
    );
    const config = getConfig({ configPath: configFile.filePath, envPath: '' });
    
    expect(config).not.toEqual(null);
    expect(config!['OCO_OPENAI_API_KEY']).toEqual('sk-key');
    expect(config!['OCO_ANTHROPIC_API_KEY']).toEqual('secret-key');
    expect(config!['OCO_AZURE_API_KEY']).toEqual('azure-key');
    expect(config!['OCO_GEMINI_API_KEY']).toEqual('gemini-key');
    expect(config!['OCO_TOKENS_MAX_INPUT']).toEqual(8192);
    expect(config!['OCO_TOKENS_MAX_OUTPUT']).toEqual(1000);
    expect(config!['OCO_OPENAI_BASE_PATH']).toEqual('/openai/api');
    expect(config!['OCO_DESCRIPTION']).toEqual(true);
    expect(config!['OCO_EMOJI']).toEqual(true);
    expect(config!['OCO_MODEL']).toEqual('gpt-4');
    expect(config!['OCO_LANGUAGE']).toEqual('de');
    expect(config!['OCO_MESSAGE_TEMPLATE_PLACEHOLDER']).toEqual('$m');
    expect(config!['OCO_PROMPT_MODULE']).toEqual('@commitlint');
    expect(() => ['ollama', 'gemini'].includes(config!['OCO_AI_PROVIDER'])).toBeTruthy();
    expect(config!['OCO_GITPUSH']).toEqual(false);
    expect(config!['OCO_ONE_LINE_COMMIT']).toEqual(true);
    expect(config!['OCO_AZURE_ENDPOINT']).toEqual('https://dummy.openai.azure.com');
    expect(config!['OCO_TEST_MOCK_TYPE']).toEqual('commit-message');
    expect(config!['OCO_FLOWISE_ENDPOINT']).toEqual('http://flowise.endpoint');
    expect(config!['OCO_FLOWISE_API_KEY']).toEqual('flowise-key');
    expect(config!['OCO_BACKEND_ENDPOINT']).toEqual('localhost:8000');
    expect(config!['OCO_BACKEND_PATH']).toEqual('api/generate');
    expect(config!['OCO_VCS_ENGINE']).toEqual('git');

    await configFile.cleanup();
  });

  it('return config values from the local env file', async () => {
    const envFile = await prepareFile(
      '.env',
      `
OCO_OPENAI_API_KEY="sk-key"
OCO_ANTHROPIC_API_KEY="secret-key"
OCO_AZURE_API_KEY="azure-key"
OCO_GEMINI_API_KEY="gemini-key"
OCO_TOKENS_MAX_INPUT="8192"
OCO_TOKENS_MAX_OUTPUT="1000"
OCO_OPENAI_BASE_PATH="/openai/api"
OCO_DESCRIPTION="true"
OCO_EMOJI="true"
OCO_MODEL="gpt-4"
OCO_LANGUAGE="de"
OCO_MESSAGE_TEMPLATE_PLACEHOLDER="$m"
OCO_PROMPT_MODULE="@commitlint"
OCO_AI_PROVIDER="ollama"
OCO_GITPUSH="false"
OCO_ONE_LINE_COMMIT="true"
OCO_AZURE_ENDPOINT="https://dummy.openai.azure.com"
OCO_TEST_MOCK_TYPE="commit-message"
OCO_FLOWISE_ENDPOINT="http://flowise.endpoint"
OCO_FLOWISE_API_KEY="flowise-key"
OCO_BACKEND_ENDPOINT="localhost:8000"
OCO_BACKEND_PATH="api/generate"
OCO_VCS_ENGINE="git"
    `
    );
    const config = getConfig({ configPath: '', envPath: envFile.filePath });

    expect(config).not.toEqual(null);
    expect(config!['OCO_OPENAI_API_KEY']).toEqual('sk-key');
    expect(config!['OCO_ANTHROPIC_API_KEY']).toEqual('secret-key');
    expect(config!['OCO_AZURE_API_KEY']).toEqual('azure-key');
    expect(config!['OCO_GEMINI_API_KEY']).toEqual('gemini-key');
    expect(config!['OCO_TOKENS_MAX_INPUT']).toEqual(8192);
    expect(config!['OCO_TOKENS_MAX_OUTPUT']).toEqual(1000);
    expect(config!['OCO_OPENAI_BASE_PATH']).toEqual('/openai/api');
    expect(config!['OCO_DESCRIPTION']).toEqual(true);
    expect(config!['OCO_EMOJI']).toEqual(true);
    expect(config!['OCO_MODEL']).toEqual('gpt-4');
    expect(config!['OCO_LANGUAGE']).toEqual('de');
    expect(config!['OCO_MESSAGE_TEMPLATE_PLACEHOLDER']).toEqual('$m');
    expect(config!['OCO_PROMPT_MODULE']).toEqual('@commitlint');
    expect(() => ['ollama', 'gemini'].includes(config!['OCO_AI_PROVIDER'])).toBeTruthy();
    expect(config!['OCO_GITPUSH']).toEqual(false);
    expect(config!['OCO_ONE_LINE_COMMIT']).toEqual(true);
    expect(config!['OCO_AZURE_ENDPOINT']).toEqual('https://dummy.openai.azure.com');
    expect(config!['OCO_TEST_MOCK_TYPE']).toEqual('commit-message');
    expect(config!['OCO_FLOWISE_ENDPOINT']).toEqual('http://flowise.endpoint');
    expect(config!['OCO_FLOWISE_API_KEY']).toEqual('flowise-key');
    expect(config!['OCO_BACKEND_ENDPOINT']).toEqual('localhost:8000');
    expect(config!['OCO_BACKEND_PATH']).toEqual('api/generate');
    expect(config!['OCO_VCS_ENGINE']).toEqual('git');

    await envFile.cleanup();
  });
});
