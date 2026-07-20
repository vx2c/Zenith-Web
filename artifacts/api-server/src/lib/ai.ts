// AI response generator for Roblox Studio assistance
// Generates contextual Lua code suggestions and explanations

interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIResponse {
  content: string;
  codeSnippet: string | null;
  codeLanguage: string | null;
}

const ROBLOX_RESPONSES: Array<{
  keywords: string[];
  response: string;
  code?: string;
}> = [
  {
    keywords: ["part", "brick", "create", "spawn", "new"],
    response:
      "I can help you create a new Part in your Roblox game. Here's a script that creates a colored part at a specific position in the workspace:",
    code: `-- Create a new Part in the Workspace
local part = Instance.new("Part")
part.Name = "MyPart"
part.Size = Vector3.new(4, 1, 4)
part.Position = Vector3.new(0, 5, 0)
part.BrickColor = BrickColor.new("Bright blue")
part.Anchored = true
part.Parent = workspace

-- Optional: Add a click detector
local clickDetector = Instance.new("ClickDetector")
clickDetector.Parent = part
clickDetector.MouseClick:Connect(function(player)
    print(player.Name .. " clicked the part!")
end)`,
  },
  {
    keywords: ["move", "tween", "animate", "position"],
    response:
      "To animate movement in Roblox, use TweenService for smooth transitions. Here's how to smoothly move a part:",
    code: `-- Smooth movement using TweenService
local TweenService = game:GetService("TweenService")
local part = workspace.MyPart -- replace with your part

local tweenInfo = TweenInfo.new(
    2,                          -- Duration (seconds)
    Enum.EasingStyle.Sine,      -- Easing style
    Enum.EasingDirection.Out,   -- Easing direction
    0,                          -- Repeat count (0 = no repeat)
    false,                      -- Reverse
    0                           -- Delay
)

local goal = {
    Position = Vector3.new(10, 5, 0)
}

local tween = TweenService:Create(part, tweenInfo, goal)
tween:Play()
tween.Completed:Connect(function()
    print("Tween completed!")
end)`,
  },
  {
    keywords: ["gui", "ui", "button", "screen", "interface"],
    response:
      "Creating a ScreenGui in Roblox lets you build custom UI elements. Here's a basic UI setup with a button:",
    code: `-- Create a ScreenGui with a button
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local screenGui = Instance.new("ScreenGui")
screenGui.Name = "MyGui"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local button = Instance.new("TextButton")
button.Size = UDim2.new(0, 200, 0, 50)
button.Position = UDim2.new(0.5, -100, 0.5, -25)
button.BackgroundColor3 = Color3.fromRGB(0, 178, 255)
button.TextColor3 = Color3.fromRGB(255, 255, 255)
button.Text = "Click Me!"
button.Font = Enum.Font.GothamBold
button.TextSize = 18
button.Parent = screenGui

-- Add rounded corners
local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 8)
corner.Parent = button

button.MouseButton1Click:Connect(function()
    print("Button clicked!")
end)`,
  },
  {
    keywords: ["player", "character", "spawn", "respawn", "death"],
    response:
      "Managing player events in Roblox is done through the Players service. Here's how to handle player spawning and character events:",
    code: `-- Handle player spawning and character events
local Players = game:GetService("Players")

local function onCharacterAdded(character)
    print("Character spawned: " .. character.Name)
    
    local humanoid = character:WaitForChild("Humanoid")
    
    -- Handle death
    humanoid.Died:Connect(function()
        print(character.Name .. " died!")
        -- Add respawn logic or effects here
    end)
    
    -- Modify character properties
    humanoid.WalkSpeed = 20      -- Default is 16
    humanoid.JumpPower = 60      -- Default is 50
    humanoid.MaxHealth = 150     -- Default is 100
    humanoid.Health = 150
end

local function onPlayerAdded(player)
    print(player.Name .. " joined the game")
    
    if player.Character then
        onCharacterAdded(player.Character)
    end
    player.CharacterAdded:Connect(onCharacterAdded)
end

Players.PlayerAdded:Connect(onPlayerAdded)

-- Handle players who joined before the script ran
for _, player in Players:GetPlayers() do
    onPlayerAdded(player)
end`,
  },
  {
    keywords: ["datastore", "save", "load", "data", "persistent"],
    response:
      "DataStores allow you to save player data between sessions. Here's a reliable DataStore setup with error handling:",
    code: `-- DataStore setup for saving player data
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local playerDataStore = DataStoreService:GetDataStore("PlayerData_v1")

local DEFAULT_DATA = {
    coins = 0,
    level = 1,
    experience = 0,
}

local function loadPlayerData(player)
    local success, data = pcall(function()
        return playerDataStore:GetAsync("player_" .. player.UserId)
    end)
    
    if success then
        return data or DEFAULT_DATA
    else
        warn("Failed to load data for " .. player.Name .. ": " .. data)
        return DEFAULT_DATA
    end
end

local function savePlayerData(player, data)
    local success, err = pcall(function()
        playerDataStore:SetAsync("player_" .. player.UserId, data)
    end)
    
    if not success then
        warn("Failed to save data for " .. player.Name .. ": " .. err)
    end
end

Players.PlayerAdded:Connect(function(player)
    local data = loadPlayerData(player)
    -- Store data in a module or leaderstats
    print("Loaded data for " .. player.Name)
end)

Players.PlayerRemoving:Connect(function(player)
    -- Save data when player leaves
    local data = DEFAULT_DATA -- replace with actual player data
    savePlayerData(player, data)
end)`,
  },
  {
    keywords: ["remote", "event", "function", "server", "client", "communicate"],
    response:
      "RemoteEvents and RemoteFunctions allow communication between the server and clients. Here's a proper setup:",
    code: `-- RemoteEvent setup for client-server communication
-- Place this in ReplicatedStorage

-- SERVER SCRIPT (ServerScriptService)
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

-- Create RemoteEvent
local remoteEvent = Instance.new("RemoteEvent")
remoteEvent.Name = "PlayerAction"
remoteEvent.Parent = ReplicatedStorage

-- Create RemoteFunction
local remoteFunction = Instance.new("RemoteFunction")
remoteFunction.Name = "GetPlayerInfo"
remoteFunction.Parent = ReplicatedStorage

-- Listen for events from client
remoteEvent.OnServerEvent:Connect(function(player, action, data)
    print(player.Name .. " performed action: " .. action)
    -- Handle the action
    if action == "collectCoin" then
        -- Update player coins
        print("Player collected a coin!")
    end
end)

-- Handle function calls from client
remoteFunction.OnServerInvoke = function(player)
    return {
        name = player.Name,
        userId = player.UserId,
        teamColor = player.TeamColor
    }
end

-- CLIENT SCRIPT (LocalScript in StarterPlayerScripts)
--[[
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local remoteEvent = ReplicatedStorage:WaitForChild("PlayerAction")
local remoteFunction = ReplicatedStorage:WaitForChild("GetPlayerInfo")

-- Fire event to server
remoteEvent:FireServer("collectCoin", { coinId = 123 })

-- Call function on server
local playerInfo = remoteFunction:InvokeServer()
print("My info:", playerInfo.name)
]]`,
  },
];

function findBestResponse(messages: AIMessage[]): AIResponse {
  const lastUserMessage = messages
    .filter((m) => m.role === "user")
    .pop();

  if (!lastUserMessage) {
    return {
      content:
        "Hello! I'm your Roblox Studio AI assistant. I can help you write Lua scripts, create game mechanics, manage player data, build UIs, and much more. What would you like to build today?",
      codeSnippet: null,
      codeLanguage: null,
    };
  }

  const text = lastUserMessage.content.toLowerCase();

  // Find matching response
  for (const item of ROBLOX_RESPONSES) {
    if (item.keywords.some((kw) => text.includes(kw))) {
      return {
        content: item.response,
        codeSnippet: item.code ?? null,
        codeLanguage: item.code ? "lua" : null,
      };
    }
  }

  // Generic helpful response
  return {
    content: `Great question! To address "${lastUserMessage.content}" in Roblox Studio, you'll want to use Luau scripting. Roblox's scripting environment gives you access to a wide range of services and APIs. Could you give me more details about what specific behavior you're trying to achieve? For example:

- What type of script are you working with (Script, LocalScript, ModuleScript)?
- Are you building a game mechanic, UI element, or something else?
- Do you have any existing code you'd like me to improve?

I'll give you a precise Lua script tailored to your needs!`,
    codeSnippet: null,
    codeLanguage: null,
  };
}

export async function generateAIResponse(
  messages: AIMessage[],
): Promise<AIResponse> {
  // Simulate a brief processing delay for realism
  await new Promise((resolve) => setTimeout(resolve, 800));
  return findBestResponse(messages);
}
