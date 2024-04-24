local Framework = exports.Framework.GetCoreObject()
local function UpdateHungerThirst()
    if LocalPlayer.state.isLoggedIn then
        -- print("loop 2 started")
        if (Framework.Functions.GetPlayerData().metadata['hunger'] <= 0 or Framework.Functions.GetPlayerData().metadata['thirst'] <= 0) and not (Framework.Functions.GetPlayerData().metadata['isdead'] or Framework.Functions.GetPlayerData().metadata['inlaststand']) then
            local ped = PlayerPedId()
            local currentHealth = GetEntityHealth(ped)
            local decreaseThreshold = math.random(5, 10)
            SetEntityHealth(ped, currentHealth - decreaseThreshold)
        end
    end
    Wait(Framework.Config.StatusInterval)
    SetTimeout(50, UpdateHungerThirst())
end
UpdateHungerThirst()