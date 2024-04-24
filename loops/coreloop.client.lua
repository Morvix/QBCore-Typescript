local Framework = exports['Framework']:GetCoreObject()
local function UpdateStatus()
    local sleep = 0
    if LocalPlayer.state.isLoggedIn then
        print("loop 1 started")
        sleep = (1000 * 60) * Framework.Config.UpdateInterval
        TriggerServerEvent('Framework:UpdatePlayer')
    end
    Wait(sleep)
    SetTimeout(50, UpdateStatus())
end
UpdateStatus()