local Framework = exports['Framework']:GetCoreObject()
local function Draw3DText(coords, str)
    local onScreen, worldX, worldY = World3dToScreen2d(coords.x, coords.y, coords.z)
    local camCoords = GetGameplayCamCoord()
    local scale = 200 / (GetGameplayCamFov() * #(camCoords - coords))
    if onScreen then
        SetTextScale(1.0, 0.5 * scale)
        SetTextFont(4)
        SetTextColour(255, 255, 255, 255)
        SetTextEdge(2, 0, 0, 0, 150)
        SetTextProportional(1)
        SetTextOutline()
        SetTextCentre(1)
        BeginTextCommandDisplayText('STRING')
        AddTextComponentSubstringPlayerName(str)
        EndTextCommandDisplayText(worldX, worldY)
    end
end

RegisterNetEvent('Framework:Command:ShowMe3D', function(senderId, msg)
    local sender = GetPlayerFromServerId(senderId)
    CreateThread(function()
        local displayTime = 5000 + GetGameTimer()
        while displayTime > GetGameTimer() do
            local targetPed = GetPlayerPed(sender)
            local tCoords = GetEntityCoords(targetPed)
            Draw3DText(tCoords, msg)
            Wait(0)
        end
    end)
end)

local function RequestAnimationDict(AnimDict)
    RequestAnimDict(AnimDict)
    while not HasAnimDictLoaded(AnimDict) do
        Wait(10)
    end
end

local function AddBlipToCoords(Coords, Sprite, Scale, Color, Text)
    Blips = AddBlipForCoord(Coords.x, Coords.y, Coords.z)
    SetBlipSprite(Blips, Sprite)
    SetBlipDisplay(Blips, 4)
    SetBlipScale(Blips, Scale)
    SetBlipAsShortRange(Blips, true)
    SetBlipColour(Blips, Color)
    BeginTextCommandSetBlipName("STRING")
    AddTextComponentSubstringPlayerName(Text)
    EndTextCommandSetBlipName(Blips)
end

local function RequestModelHash(Model)
    RequestModel(Model)
    while not HasModelLoaded(Model) do
        Wait(10)
    end
end

local function RequestAnimationSet()
    while not HasAnimSetLoaded('move_ped_crouched') do
        Wait(5)
        RequestAnimSet('move_ped_crouched')
    end
end

exports('AddBlipToCoords', AddBlipToCoords)
exports('RequestAnimationDict', RequestAnimationDict)
exports('RequestModelHash', RequestModelHash)
exports('RequestAnimationSet', RequestAnimationSet)
