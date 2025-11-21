import { registerLoginMethodTools } from "../../src/tools/loginmethod-tools.js";
import { readFile } from "../../src/resourceprovider.js";
import {
  createMockServer,
  createMockSimplifierClient,
  getRegisterToolSchema
} from "./loginmethod/shared-test-helpers.js";

// Mock the resourceprovider
jest.mock("../../src/resourceprovider.js", () => ({
  readFile: jest.fn()
}));

describe('registerLoginMethodTools - function registration', () => {
  let mockReadFile: jest.MockedFunction<typeof readFile>;

  beforeEach(() => {
    mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
    mockReadFile.mockReturnValue("This is the login method documentation content");
    jest.clearAllMocks();
  });

  it('should register loginmethod-update tool', () => {
    const mockServer = createMockServer();
    const mockClient = createMockSimplifierClient();

    registerLoginMethodTools(mockServer, mockClient);

    expect(mockServer.registerTool).toHaveBeenCalledTimes(1);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      "loginmethod-update",
      expect.objectContaining({
        description: expect.any(String),
        inputSchema: expect.objectContaining({
          name: expect.any(Object),
          description: expect.any(Object),
          username: expect.any(Object),
          password: expect.any(Object),
          changePassword: expect.any(Object)
        }),
        annotations: expect.objectContaining({
          title: "Create or update a Login Method",
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true
        }),
      }),
      expect.any(Function)
    );
  });

  it('should validate required schema fields', () => {
    const mockServer = createMockServer();
    const mockClient = createMockSimplifierClient();

    registerLoginMethodTools(mockServer, mockClient);

    const schema = getRegisterToolSchema(mockServer)

    // Test that schema validates required fields
    expect(schema.name).toBeDefined();
    expect(schema.description).toBeDefined();
    expect(schema.username).toBeDefined();
    expect(schema.password).toBeDefined();
    expect(schema.changePassword).toBeDefined();

    // Test valid data passes validation
    expect(() => schema.name.parse("MyLoginMethod")).not.toThrow();
    expect(() => schema.description.parse("Test description")).not.toThrow();
    expect(() => schema.username.parse("admin")).not.toThrow();
    expect(() => schema.password.parse("secretPassword")).not.toThrow();
    expect(() => schema.changePassword.parse(true)).not.toThrow();
  });

  it('should have default value for changePassword', () => {
    const mockServer = createMockServer();
    const mockClient = createMockSimplifierClient();

    registerLoginMethodTools(mockServer, mockClient);

    const schema = getRegisterToolSchema(mockServer)

    // Test default value for changePassword
    expect(schema.changePassword.parse(undefined)).toBe(false);
  });

  it('should require name, description, and loginMethodType', () => {
    const mockServer = createMockServer();
    const mockClient = createMockSimplifierClient();

    registerLoginMethodTools(mockServer, mockClient);

    const schema = getRegisterToolSchema(mockServer)

    // Test that required fields throw on undefined
    expect(() => schema.name.parse(undefined)).toThrow();
    expect(() => schema.description.parse(undefined)).toThrow();
    expect(() => schema.loginMethodType.parse(undefined)).toThrow();

    // Test that username and password are optional
    expect(() => schema.username.parse(undefined)).not.toThrow();
    expect(() => schema.password.parse(undefined)).not.toThrow();
  });
});
