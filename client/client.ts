let Framework: any = {};
function Delay(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}
export const QBConfig = JSON.parse(
  LoadResourceFile(GetCurrentResourceName(), "config.json")
);
export const QBShared = JSON.parse(
  LoadResourceFile(GetCurrentResourceName(), "shared.json")
);
// import { QBShared } from "../shared/shared";

Framework.PlayerData = {}
Framework.Config = QBConfig;
Framework.Shared = QBShared;
Framework.ClientCallbacks = Framework.ClientCallbacks || {} as any;
Framework.ServerCallbacks = Framework.ServerCallbacks || {} as any;
Framework.Functions = Framework.Functions || ({} as any);
Framework.Debug = (tbl: any, indent?: number) => {
  const resource = GetInvokingResource() ?? 'qb-core';
  TriggerServerEvent('Framework:DebugSomething', tbl, indent, resource);
};

// Function Section
Framework.Functions.GetPlayerData = (
  cb?: (playerData: any) => void
): any | void => {
  if (!cb) {
    return Framework.PlayerData;
  } else {
    cb(Framework.PlayerData);
  }
};

Framework.Functions.GetCoords = (entity: number): any => {
  const coords = GetEntityCoords(entity, false);
  const heading = GetEntityHeading(entity);
  return `vector4(${coords[0]}, ${coords[1]}, ${coords[2]}, ${heading})`;
};

Framework.Functions.HasItem = (items: any, amount?: any): any => {
  return exports["inventory"].HasItem(items, amount);
};
Framework.Functions.DrawText = (
  x: any,
  y: any,
  width: any,
  height: any,
  scale: any,
  r: any,
  g: any,
  b: any,
  a: any,
  text: any
): any => {
  SetTextFont(4);
  SetTextScale(scale, scale);
  SetTextColour(r, g, b, a);
  BeginTextCommandDisplayText("STRING");
  AddTextComponentSubstringPlayerName(text);
  EndTextCommandDisplayText(x - width / 2, y - height / 2 + 0.005);
};
Framework.Functions.DrawText3D = (x: any, y: any, z: any, text: any): any => {
  SetTextScale(0.35, 0.35);
  SetTextFont(4);
  SetTextProportional(true);
  SetTextColour(255, 255, 255, 215);
  BeginTextCommandDisplayText("STRING");
  SetTextCentre(true);
  AddTextComponentSubstringPlayerName(text);
  SetDrawOrigin(x, y, z, 0);
  EndTextCommandDisplayText(0.0, 0.0);
  const factor = text.lenght / 370;
  DrawRect(0.0, 0.0 + 0.0125, 0.017 + factor, 0.03, 0, 0, 0, 75);
  ClearDrawOrigin();
};
Framework.Functions.RequestAnimDict = (animDict: any) => {
  if (HasAnimDictLoaded(animDict)) return;
  RequestAnimDict(animDict);
  while (!HasAnimDictLoaded(animDict)) {
    const interval = setInterval(() => {
      if (HasAnimDictLoaded(animDict)) {
        clearInterval(interval);
      }
    }, 1000);
  }
};
Framework.Functions.LookAtEntity = async (
  entity: number,
  timeout: number,
  speed: number
): Promise<any> => {
  if (!DoesEntityExist(entity)) {
    throw new Error("Entity does not exist");
  }
  if (typeof entity !== "number") {
    throw new Error("Entity must be a number");
  }
  if (typeof speed !== "number") {
    throw new Error("Speed must be a number");
  }

  speed = Math.min(speed, 5.0);
  timeout = Math.min(timeout, 5000);

  const ped = PlayerPedId();
  const playerPos = GetEntityCoords(ped, true);
  const targetPos = GetEntityCoords(entity, true);

  const dx = targetPos[0] - playerPos[0];
  const dy = targetPos[1] - playerPos[1];
  let targetHeading = GetHeadingFromVector_2d(dx, dy);

  let startTimeout = GetGameTimer();
  while (true) {
    let currentHeading = GetEntityHeading(ped);
    let diff = targetHeading - currentHeading;

    if (Math.abs(diff) < 2) break;
    if (diff < -180) diff += 360;
    else if (diff > 180) diff -= 360;

    let adjustedSpeed = speed + (2.5 - speed) * (1 - Math.abs(diff) / 180);
    currentHeading += diff > 0 ? adjustedSpeed : -adjustedSpeed;

    SetEntityHeading(ped, currentHeading);
    await new Promise((resolve) => setTimeout(resolve, 0));

    if (startTimeout + timeout < GetGameTimer()) break;
  }

  SetEntityHeading(ped, targetHeading);
};
Framework.Functions.LoadModel = (model: any): any => {
  if (HasModelLoaded(model)) return;
  RequestModel(model);
  while (!HasModelLoaded(model)) {
    const interval = setInterval(() => {
      if (HasModelLoaded(model)) {
        clearInterval(interval);
      }
    }, 1000);
  }
};
Framework.Functions.LoadAnimSet = (animSet: any): any => {
  if (HasAnimSetLoaded(animSet)) return;
  RequestAnimSet(animSet);
  while (!HasAnimSetLoaded(animSet)) {
    const interval = setInterval(() => {
      if (HasAnimSetLoaded(animSet)) {
        clearInterval(interval);
      }
    }, 1000);
  }
};
Framework.Functions.Notify = (
  text: any,
  texttype: any,
  length: any,
  icon: any
): any => {
  console.log(`Notify: ${text} ${texttype} ${length} ${icon}`);
};
Framework.Functions.CreateClientCallback = (name: any, cb: any): any => {
  Framework.ClientCallbacks[name] = cb;
};
Framework.Functions.TriggerClientCallback = (
  name: any,
  cb: any,
  ...args: any
) => {
  if (!Framework.ClientCallbacks[name]) return;
  Framework.ClientCallbacks[name](cb, ...args);
};
Framework.Functions.TriggerCallback = (name: any, cb: any, ...args: any) => {
  Framework.ServerCallbacks[name] = cb;
  TriggerServerEvent("Framework:Server:TriggerCallback", name, ...args);
};
Framework.Functions.Progressbar = (
  name?: any,
  label?: any,
  duration?: any,
  useWhileDead?: any,
  canCancel?: any,
  disableControls?: any,
  animation?: any,
  prop?: any,
  propTwo?: any,
  onFinish?: any,
  onCancel?: any
) => {
  if (GetResourceState("ui") !== "started") {
    console.error(
      "progressbar needs to be started in order for QBCore.Functions.Progressbar to work"
    );
  }
  global.exports["ui"].Progress(
    {
      name: name.toLowerCase(),
      duration: duration,
      label: label,
      useWhileDead: useWhileDead,
      canCancel: canCancel,
      controlDisables: disableControls,
      animation: animation,
      prop: prop,
      propTwo: propTwo,
    },
    (cancelled: any) => {
      if (!cancelled) {
        if (onFinish) {
          onFinish();
        }
      } else {
        if (onCancel) {
          onCancel();
        }
      }
    }
  );
};

Framework.Functions.GetVehicles = () => {
  return GetGamePool("CVehicle");
};
Framework.Functions.GetObjects = () => {
  return GetGamePool("CObject");
};

Framework.Functions.GetPlayers = () => {
  return GetActivePlayers();
};
Framework.Functions.GetPeds = (ignoreList: number[] = []): number[] => {
  const pedPool = GetGamePool('CPed');
  const peds: number[] = [];
  ignoreList = ignoreList || [];
  for (let i = 0; i < pedPool.length; i++) {
    let found = false;
    for (let j = 0; j < ignoreList.length; j++) {
      if (ignoreList[j] === pedPool[i]) {
        found = true;
        break;
      }
    }
    if (!found) {
      peds.push(pedPool[i]);
    }
  }
  return peds;
};
Framework.Functions.GetClosestPed = (coords: any, ignoreList: any) => {
  const ped = PlayerPedId();
  if (coords) {
    coords = coords;
  } else {
    coords = GetEntityCoords(ped, true);
  }
  ignoreList = ignoreList || [];
  const peds = Framework.Functions.GetPeds(ignoreList);
  let closestDistance = -1;
  let closestPed = -1;
  for (let i = 0; i < peds.length; i++) {
    const pedCoords = GetEntityCoords(peds[i], true);
    const distance = distanceBetweenCoords(pedCoords, coords);

    if (closestDistance === -1 || closestDistance > distance) {
      closestPed = peds[i];
      closestDistance = distance;
    }
  }
  return [closestPed, closestDistance];
};

Framework.Functions.IsWearingGloves = () => {
  const ped = PlayerPedId();
  const armIndex = GetPedDrawableVariation(ped, 3);
  const model = GetEntityModel(ped).toString(); // Convert model to string
  if (model === `mp_m_freemode_01`) {
    if (Framework.Shared.MaleNoGloves[armIndex]) {
      // Add missing parentheses
      return false;
    }
  } else if (Framework.Shared.FemaleNoGloves[armIndex]) {
    // Add missing parentheses and change 'then' to '{'
    return false;
  }
  return true;
};

Framework.Functions.GetClosestPlayer = (coords: any | undefined): [number, number] => {
  const ped = PlayerPedId();
  if (coords) {
    coords = typeof coords === 'object' ? coords : coords;
  } else {
    coords = GetEntityCoords(ped, true);
  }
  const closestPlayers = Framework.Functions.GetPlayersFromCoords(coords);
  let closestDistance = -1;
  let closestPlayer = -1;
  for (let i = 0; i < closestPlayers.length; i++) {
    if (closestPlayers[i] !== PlayerId() && closestPlayers[i] !== -1) {
      const pos = GetEntityCoords(GetPlayerPed(closestPlayers[i]), true);
      const distance = distanceBetweenCoords(pos, coords);
      if (closestDistance === -1 || closestDistance > distance) {
        closestPlayer = closestPlayers[i];
        closestDistance = distance;
      }
    }
  }
  return [closestPlayer, closestDistance];
};
Framework.Functions.GetPlayersFromCoords = (coords: any, distance: any) => {
  const players = GetActivePlayers();
  const ped = PlayerPedId();
  if (coords) {
    coords = typeof coords === 'object' ? coords : coords;
  } else {
    coords = GetEntityCoords(ped, true);
  }
  distance = distance || 5;
  const closePlayers = [];
  for (const player of players) {
    const target = GetPlayerPed(player);
    const targetCoords = GetEntityCoords(target, true);
    const targetDistance = distanceBetweenCoords(targetCoords, coords);
    if (targetDistance <= distance) {
      closePlayers.push(player);
    }
  }
  return closePlayers;
};
function distanceBetweenCoords(coords1: any, coords2: any): number {
  return Math.hypot(coords1[0] - coords1[0], coords1[1] - coords2[1], coords2[2] - coords2[2])
}

Framework.Functions.GetClosestVehicle = (coords: any): [number, number] => {
  const ped = PlayerPedId();
  const vehicles = GetGamePool('CVehicle');
  let closestDistance = -1;
  let closestVehicle = -1;

  if (coords) {
    coords = coords;
  } else {
    coords = GetEntityCoords(ped, true);
  }

  for (let i = 0; i < vehicles.length; i++) {
    const vehicleCoords = GetEntityCoords(vehicles[i], true);
    const distance = distanceBetweenCoords(vehicleCoords, coords);

    if (closestDistance === -1 || closestDistance > distance) {
      closestVehicle = vehicles[i];
      closestDistance = distance;
    }
  }

  return [closestVehicle, closestDistance];
};

Framework.Functions.GetClosestObject = (coords: any): [number, number] => {
  const ped = PlayerPedId();
  const objects = GetGamePool("CObject") as number[]; // Casting as number[] assuming object handles are numbers
  let closestDistance = -1;
  let closestObject = -1;
  let actualCoords: any;
  if (!coords) {
    actualCoords = GetEntityCoords(ped, true);
  } else {
    actualCoords = coords;
  }

  objects.forEach((object) => {
    const objectCoords = GetEntityCoords(object, true);
    const distance = Vdist2(
      actualCoords[0],
      actualCoords[1],
      actualCoords[2],
      objectCoords[0],
      objectCoords[1],
      objectCoords[2]
    );

    if (closestDistance === -1 || closestDistance > distance) {
      closestObject = object;
      closestDistance = distance;
    }
  });

  return [closestObject, closestDistance];
};

Framework.Functions.GetClosestBone = (
  entity: number,
  list: { id?: number; name?: string }[]
): [{ id: number; type?: string; name?: string }, any, number] => {
  const playerCoords: any = GetEntityCoords(PlayerPedId(), false);
  let closestBone: any | undefined;
  let closestCoords: any | undefined;
  let closestDistance: number = Infinity;

  list.forEach((bone) => {
    const boneId = typeof bone === "object" ? bone.id : bone;
    const boneCoords: any = GetWorldPositionOfEntityBone(
      entity,
      boneId as number
    );
    const boneDistance: number = GetDistanceBetweenCoords(
      playerCoords[0],
      playerCoords[1],
      playerCoords[2],
      boneCoords[0],
      boneCoords[1],
      boneCoords[2],
      true
    );

    if (boneDistance < closestDistance) {
      closestBone = bone;
      closestCoords = boneCoords;
      closestDistance = boneDistance;
    }
  });

  if (!closestBone) {
    const fallbackBoneId: number = GetEntityBoneIndexByName(
      entity,
      "bodyshell"
    );
    closestBone = { id: fallbackBoneId, type: "remains", name: "bodyshell" };
    closestCoords = GetWorldPositionOfEntityBone(entity, fallbackBoneId);
    closestDistance = GetDistanceBetweenCoords(
      playerCoords[0],
      playerCoords[1],
      playerCoords[2],
      closestCoords[0],
      closestCoords[1],
      closestCoords[2],
      true
    );
  }

  return [closestBone, closestCoords as any, closestDistance];
};

Framework.Functions.GetBoneDistance = (
  entity: number,
  boneType: number,
  boneIndex: number | string
): number => {
  let bone: number;
  if (boneType === 1) {
    bone = GetPedBoneIndex(entity, boneIndex as number);
  } else {
    bone = GetEntityBoneIndexByName(entity, boneIndex as string);
  }
  const boneCoords: number[] = GetWorldPositionOfEntityBone(entity, bone);
  const playerCoords: number[] = GetEntityCoords(PlayerPedId(), false);
  return GetDistanceBetweenCoords(
    playerCoords[0],
    playerCoords[1],
    playerCoords[2],
    boneCoords[0],
    boneCoords[1],
    boneCoords[2],
    true
  );
};

Framework.Functions.AttachProp = (
  ped: number,
  model: string | number,
  boneId: number,
  x: number,
  y: number,
  z: number,
  xR: number,
  yR: number,
  zR: number,
  vertex: boolean
) => {
  const modelHash = typeof model === "string" ? GetHashKey(model) : model;
  Framework.Functions.LoadModel(modelHash);
  const bone: number = GetPedBoneIndex(ped, boneId);
  const prop: number = CreateObject(
    modelHash,
    1.0,
    1.0,
    1.0,
    true,
    true,
    false
  );
  AttachEntityToEntity(
    prop,
    ped,
    bone,
    x,
    y,
    z,
    xR,
    yR,
    zR,
    true,
    true,
    false,
    false,
    vertex ? 0 : 2,
    true
  );
  SetModelAsNoLongerNeeded(modelHash);
  return prop;
};

Framework.Functions.SpawnVehicle = (
  model: string | number,
  cb: (veh: number) => void,
  coords?: any,
  isNetworked: boolean = true,
  teleportInto: boolean = false
) => {
  const ped: number = PlayerPedId();
  model = typeof model === "string" ? GetHashKey(model) : model;
  if (!IsModelInCdimage(model)) return;
  let actualCoords = coords ? coords : GetEntityCoords(ped, false);
  let heading = coords?.w || GetEntityHeading(ped);
  Framework.Functions.LoadModel(model);
  const veh: number = CreateVehicle(
    model,
    actualCoords.x,
    actualCoords.y,
    actualCoords.z,
    heading,
    isNetworked,
    false
  );
  const netId: number = NetworkGetNetworkIdFromEntity(veh);
  SetVehicleHasBeenOwnedByPlayer(veh, true);
  SetNetworkIdCanMigrate(netId, true);
  SetVehicleNeedsToBeHotwired(veh, false);
  SetVehRadioStation(veh, "OFF");
  SetVehicleFuelLevel(veh, 100.0);
  SetModelAsNoLongerNeeded(model);
  if (teleportInto) TaskWarpPedIntoVehicle(ped, veh, -1);
  if (cb) cb(veh);
};

Framework.Functions.DeleteVehicle = (vehicle: number): void => {
  SetEntityAsMissionEntity(vehicle, true, true);
  DeleteVehicle(vehicle);
};

Framework.Functions.GetPlate = (vehicle: number): string | undefined => {
  if (vehicle === 0) return undefined;
  const plateText: string = GetVehicleNumberPlateText(vehicle);
  return plateText.trim();
};

Framework.Functions.GetVehicleLabel = (vehicle: number): string | undefined => {
  if (vehicle === null || vehicle === 0) return undefined;
  const model: number = GetEntityModel(vehicle);
  const displayName: string = GetDisplayNameFromVehicleModel(model);
  const vehicleLabel: string = GetLabelText(displayName);
  return vehicleLabel;
};

Framework.Functions.GetVehicleProperties = (vehicle: any) => {
  if (DoesEntityExist(vehicle)) {
    let a1 = IsVehicleNeonLightEnabled(vehicle, 0);
    let a2 = IsVehicleNeonLightEnabled(vehicle, 1);
    let a3 = IsVehicleNeonLightEnabled(vehicle, 2);
    let a4 = IsVehicleNeonLightEnabled(vehicle, 3);

    let pearlescentColor,
      wheelColor = GetVehicleExtraColours(vehicle);

    let colorPrimary,
      colorSecondary: any = GetVehicleColours(vehicle);
    if (GetIsVehiclePrimaryColourCustom(vehicle)) {
      let r,
        g,
        b = GetVehicleCustomPrimaryColour(vehicle);
      colorPrimary = { r, g, b };
    }

    if (GetIsVehicleSecondaryColourCustom(vehicle)) {
      let r,
        g,
        b = GetVehicleCustomPrimaryColour(vehicle);
      colorSecondary = { r, g, b };
    }
    let extras: any = {};
    for (let extraId = 0; extraId <= 12; extraId++) {
      if (DoesExtraExist(vehicle, extraId)) {
        const state: any =
          IsVehicleExtraTurnedOn(vehicle as number, extraId as number) === true;
        extras[extraId.toString()] = state;
      }
    }
    let modLivery = GetVehicleMod(vehicle, 48);
    if (GetVehicleMod(vehicle, 48) === -1 && GetVehicleLivery(vehicle) !== 0) {
      modLivery = GetVehicleLivery(vehicle);
    }
    let tireHealth: { [key: number]: number } = {};
    for (let i = 0; i <= 3; i++) {
      tireHealth[i] = GetVehicleWheelHealth(vehicle, i);
    }

    let tireBurstState: { [key: number]: boolean } = {};
    for (let i = 0; i <= 5; i++) {
      tireBurstState[i] = IsVehicleTyreBurst(vehicle, i, false);
    }

    let tireBurstCompletely: { [key: number]: boolean } = {};
    for (let i = 0; i <= 5; i++) {
      tireBurstCompletely[i] = IsVehicleTyreBurst(vehicle, i, true);
    }

    let windowStatus: { [key: number]: boolean } = {};
    for (let i = 0; i <= 7; i++) {
      windowStatus[i] = IsVehicleWindowIntact(vehicle, i) === true;
    }

    let doorStatus: { [key: number]: boolean } = {};
    for (let i = 0; i <= 5; i++) {
      doorStatus[i] = IsVehicleDoorDamaged(vehicle, i) === true;
    }
    let xenonColor: number[] | number;
    const [hasCustom, r, g, b] = GetVehicleXenonLightsCustomColor(vehicle);

    if (hasCustom) {
      xenonColor = [r, g, b];
    } else {
      xenonColor = GetVehicleXenonLightsColor(vehicle);
    }
    return {
      model: GetEntityModel(vehicle),
      plate: Framework.Functions.GetPlate(vehicle),
      plateIndex: GetVehicleNumberPlateTextIndex(vehicle),
      bodyHealth: Framework.Functions.Round(GetVehicleBodyHealth(vehicle), 0.1),
      engineHealth: Framework.Functions.Round(
        GetVehicleEngineHealth(vehicle),
        0.1
      ),
      tankHealth: Framework.Functions.Round(
        GetVehiclePetrolTankHealth(vehicle),
        0.1
      ),
      fuelLevel: Framework.Functions.Round(GetVehicleFuelLevel(vehicle), 0.1),
      dirtLevel: Framework.Functions.Round(GetVehicleDirtLevel(vehicle), 0.1),
      oilLevel: Framework.Functions.Round(GetVehicleOilLevel(vehicle), 0.1),
      color1: colorPrimary,
      color2: colorSecondary,
      pearlescentColor: pearlescentColor,
      dashboardColor: GetVehicleDashboardColour(vehicle),
      wheelColor: wheelColor,
      wheels: GetVehicleWheelType(vehicle),
      wheelSize: GetVehicleWheelSize(vehicle),
      wheelWidth: GetVehicleWheelWidth(vehicle),
      tireHealth: tireHealth,
      tireBurstState: tireBurstState,
      tireBurstCompletely: tireBurstCompletely,
      windowTint: GetVehicleWindowTint(vehicle),
      windowStatus: windowStatus,
      doorStatus: doorStatus,
      neonEnabled: {
        a1,
        a2,
        a3,
        a4,
      },
      neonColor: Array.from(GetVehicleNeonLightsColour(vehicle)),
      interiorColor: GetVehicleInteriorColour(vehicle),
      extras: extras,
      tyreSmokeColor: Array.from(GetVehicleTyreSmokeColor(vehicle)),
      xenonColor: xenonColor,
      modSpoilers: GetVehicleMod(vehicle, 0),
      modFrontBumper: GetVehicleMod(vehicle, 1),
      modRearBumper: GetVehicleMod(vehicle, 2),
      modSideSkirt: GetVehicleMod(vehicle, 3),
      modExhaust: GetVehicleMod(vehicle, 4),
      modFrame: GetVehicleMod(vehicle, 5),
      modGrille: GetVehicleMod(vehicle, 6),
      modHood: GetVehicleMod(vehicle, 7),
      modFender: GetVehicleMod(vehicle, 8),
      modRightFender: GetVehicleMod(vehicle, 9),
      modRoof: GetVehicleMod(vehicle, 10),
      modEngine: GetVehicleMod(vehicle, 11),
      modBrakes: GetVehicleMod(vehicle, 12),
      modTransmission: GetVehicleMod(vehicle, 13),
      modHorns: GetVehicleMod(vehicle, 14),
      modSuspension: GetVehicleMod(vehicle, 15),
      modArmor: GetVehicleMod(vehicle, 16),
      modKit17: GetVehicleMod(vehicle, 17),
      modTurbo: IsToggleModOn(vehicle, 18),
      modKit19: GetVehicleMod(vehicle, 19),
      modSmokeEnabled: IsToggleModOn(vehicle, 20),
      modKit21: GetVehicleMod(vehicle, 21),
      modXenon: IsToggleModOn(vehicle, 22),
      modFrontWheels: GetVehicleMod(vehicle, 23),
      modBackWheels: GetVehicleMod(vehicle, 24),
      modCustomTiresF: GetVehicleModVariation(vehicle, 23),
      modCustomTiresR: GetVehicleModVariation(vehicle, 24),
      modPlateHolder: GetVehicleMod(vehicle, 25),
      modVanityPlate: GetVehicleMod(vehicle, 26),
      modTrimA: GetVehicleMod(vehicle, 27),
      modOrnaments: GetVehicleMod(vehicle, 28),
      modDashboard: GetVehicleMod(vehicle, 29),
      modDial: GetVehicleMod(vehicle, 30),
      modDoorSpeaker: GetVehicleMod(vehicle, 31),
      modSeats: GetVehicleMod(vehicle, 32),
      modSteeringWheel: GetVehicleMod(vehicle, 33),
      modShifterLeavers: GetVehicleMod(vehicle, 34),
      modAPlate: GetVehicleMod(vehicle, 35),
      modSpeakers: GetVehicleMod(vehicle, 36),
      modTrunk: GetVehicleMod(vehicle, 37),
      modHydrolic: GetVehicleMod(vehicle, 38),
      modEngineBlock: GetVehicleMod(vehicle, 39),
      modAirFilter: GetVehicleMod(vehicle, 40),
      modStruts: GetVehicleMod(vehicle, 41),
      modArchCover: GetVehicleMod(vehicle, 42),
      modAerials: GetVehicleMod(vehicle, 43),
      modTrimB: GetVehicleMod(vehicle, 44),
      modTank: GetVehicleMod(vehicle, 45),
      modWindows: GetVehicleMod(vehicle, 46),
      modKit47: GetVehicleMod(vehicle, 47),
      modLivery: modLivery,
      modKit49: GetVehicleMod(vehicle, 49),
      liveryRoof: GetVehicleRoofLivery(vehicle),
    };
  }
};
Framework.Functions.SetVehicleProperties = (vehicle: any, props: any) => {
  if (DoesEntityExist(vehicle)) {
    if (props.extras) {
      for (const id in props.extras) {
        const enabled = props.extras[id];
        if (enabled) {
          SetVehicleExtra(vehicle, parseInt(id), false);
        } else {
          SetVehicleExtra(vehicle, parseInt(id), true);
        }
      }
    }
    const [colorPrimary, colorSecondary] = GetVehicleColours(vehicle);
    const [pearlescentColor, wheelColor] = GetVehicleExtraColours(vehicle);
    SetVehicleModKit(vehicle, 0);
    if (props.plate) {
      SetVehicleNumberPlateText(vehicle, props.plate);
    }
    if (props.plateIndex) {
      SetVehicleNumberPlateTextIndex(vehicle, props.plateIndex);
    }
    if (props.bodyHealth) {
      SetVehicleBodyHealth(vehicle, props.bodyHealth + 0.0);
    }
    if (props.engineHealth) {
      SetVehicleEngineHealth(vehicle, props.engineHealth + 0.0);
    }
    if (props.tankHealth) {
      SetVehiclePetrolTankHealth(vehicle, props.tankHealth);
    }
    if (props.fuelLevel) {
      SetVehicleFuelLevel(vehicle, props.fuelLevel + 0.0);
    }
    if (props.dirtLevel) {
      SetVehicleDirtLevel(vehicle, props.dirtLevel + 0.0);
    }
    if (props.oilLevel) {
      SetVehicleOilLevel(vehicle, props.oilLevel);
    }
    if (props.color1) {
      if (typeof props.color1 === "number") {
        ClearVehicleCustomPrimaryColour(vehicle);
        SetVehicleColours(vehicle, props.color1, colorSecondary);
      } else {
        SetVehicleCustomPrimaryColour(
          vehicle,
          props.color1[0],
          props.color1[1],
          props.color1[2]
        );
      }
    }
    if (props.color2) {
      if (typeof props.color2 === "number") {
        ClearVehicleCustomSecondaryColour(vehicle);
        SetVehicleColours(vehicle, props.color1 || colorPrimary, props.color2);
      } else {
        SetVehicleCustomSecondaryColour(
          vehicle,
          props.color2[0],
          props.color2[1],
          props.color2[2]
        );
      }
    }
    if (props.pearlescentColor) {
      SetVehicleExtraColours(vehicle, props.pearlescentColor, wheelColor);
    }
    if (props.interiorColor) {
      SetVehicleInteriorColor(vehicle, props.interiorColor);
    }
    if (props.dashboardColor) {
      SetVehicleDashboardColour(vehicle, props.dashboardColor);
    }
    if (props.wheelColor) {
      SetVehicleExtraColours(
        vehicle,
        props.pearlescentColor || pearlescentColor,
        props.wheelColor
      );
    }
    if (props.wheels) {
      SetVehicleWheelType(vehicle, props.wheels);
    }
    if (props.tireHealth) {
      for (const wheelIndex in props.tireHealth) {
        const health = props.tireHealth[wheelIndex];
        SetVehicleWheelHealth(vehicle, parseInt(wheelIndex), health);
      }
    }
    if (props.tireBurstState) {
      for (const wheelIndex in props.tireBurstState) {
        const burstState = props.tireBurstState[wheelIndex];
        if (burstState) {
          SetVehicleTyreBurst(vehicle, parseInt(wheelIndex), false, 1000.0);
        }
      }
    }
    if (props.tireBurstCompletely) {
      for (const wheelIndex in props.tireBurstCompletely) {
        const burstState = props.tireBurstCompletely[wheelIndex];
        if (burstState) {
          SetVehicleTyreBurst(vehicle, parseInt(wheelIndex), true, 1000.0);
        }
      }
    }
    if (props.windowTint) {
      SetVehicleWindowTint(vehicle, props.windowTint);
    }
    if (props.windowStatus) {
      for (const windowIndex in props.windowStatus) {
        const smashWindow = props.windowStatus[windowIndex];
        if (!smashWindow) {
          SmashVehicleWindow(vehicle, parseInt(windowIndex));
        }
      }
    }
    if (props.doorStatus) {
      for (const doorIndex in props.doorStatus) {
        const breakDoor = props.doorStatus[doorIndex];
        if (breakDoor) {
          SetVehicleDoorBroken(vehicle, parseInt(doorIndex), true);
        }
      }
    }
    if (props.neonEnabled) {
      SetVehicleNeonLightEnabled(vehicle, 0, props.neonEnabled[0]);
      SetVehicleNeonLightEnabled(vehicle, 1, props.neonEnabled[1]);
      SetVehicleNeonLightEnabled(vehicle, 2, props.neonEnabled[2]);
      SetVehicleNeonLightEnabled(vehicle, 3, props.neonEnabled[3]);
    }
    if (props.neonColor) {
      SetVehicleNeonLightsColour(
        vehicle,
        props.neonColor[0],
        props.neonColor[1],
        props.neonColor[2]
      );
    }
    if (props.interiorColor) {
      SetVehicleInteriorColour(vehicle, props.interiorColor);
    }
    if (props.wheelSize) {
      SetVehicleWheelSize(vehicle, props.wheelSize);
    }
    if (props.wheelWidth) {
      SetVehicleWheelWidth(vehicle, props.wheelWidth);
    }
    if (props.tyreSmokeColor) {
      SetVehicleTyreSmokeColor(
        vehicle,
        props.tyreSmokeColor[0],
        props.tyreSmokeColor[1],
        props.tyreSmokeColor[2]
      );
    }
    if (props.modSpoilers) {
      SetVehicleMod(vehicle, 0, props.modSpoilers, false);
    }
    if (props.modFrontBumper) {
      SetVehicleMod(vehicle, 1, props.modFrontBumper, false);
    }
    if (props.modRearBumper) {
      SetVehicleMod(vehicle, 2, props.modRearBumper, false);
    }
    if (props.modSideSkirt) {
      SetVehicleMod(vehicle, 3, props.modSideSkirt, false);
    }
    if (props.modExhaust) {
      SetVehicleMod(vehicle, 4, props.modExhaust, false);
    }
    if (props.modFrame) {
      SetVehicleMod(vehicle, 5, props.modFrame, false);
    }
    if (props.modGrille) {
      SetVehicleMod(vehicle, 6, props.modGrille, false);
    }
    if (props.modHood) {
      SetVehicleMod(vehicle, 7, props.modHood, false);
    }
    if (props.modFender) {
      SetVehicleMod(vehicle, 8, props.modFender, false);
    }
    if (props.modRightFender) {
      SetVehicleMod(vehicle, 9, props.modRightFender, false);
    }
    if (props.modRoof) {
      SetVehicleMod(vehicle, 10, props.modRoof, false);
    }
    if (props.modEngine) {
      SetVehicleMod(vehicle, 11, props.modEngine, false);
    }
    if (props.modBrakes) {
      SetVehicleMod(vehicle, 12, props.modBrakes, false);
    }
    if (props.modTransmission) {
      SetVehicleMod(vehicle, 13, props.modTransmission, false);
    }
    if (props.modHorns) {
      SetVehicleMod(vehicle, 14, props.modHorns, false);
    }
    if (props.modSuspension) {
      SetVehicleMod(vehicle, 15, props.modSuspension, false);
    }
    if (props.modArmor) {
      SetVehicleMod(vehicle, 16, props.modArmor, false);
    }
    if (props.modKit17) {
      SetVehicleMod(vehicle, 17, props.modKit17, false);
    }
    if (props.modTurbo) {
      ToggleVehicleMod(vehicle, 18, props.modTurbo);
    }
    if (props.modKit19) {
      SetVehicleMod(vehicle, 19, props.modKit19, false);
    }
    if (props.modSmokeEnabled) {
      ToggleVehicleMod(vehicle, 20, props.modSmokeEnabled);
    }
    if (props.modKit21) {
      SetVehicleMod(vehicle, 21, props.modKit21, false);
    }
    if (props.modXenon) {
      ToggleVehicleMod(vehicle, 22, props.modXenon);
    }
    if (props.xenonColor) {
      if (Array.isArray(props.xenonColor)) {
        SetVehicleXenonLightsCustomColor(vehicle, props.xenonColor[0], props.xenonColor[1], props.xenonColor[2]);
      } else {
        SetVehicleXenonLightsColor(vehicle, props.xenonColor);
      }
    }
    if (props.modFrontWheels) {
      SetVehicleMod(vehicle, 23, props.modFrontWheels, false);
    }
    if (props.modBackWheels) {
      SetVehicleMod(vehicle, 24, props.modBackWheels, false);
    }
    if (props.modCustomTiresF) {
      SetVehicleMod(vehicle, 23, props.modFrontWheels, props.modCustomTiresF);
    }
    if (props.modCustomTiresR) {
      SetVehicleMod(vehicle, 24, props.modBackWheels, props.modCustomTiresR);
    }
    if (props.modPlateHolder) {
      SetVehicleMod(vehicle, 25, props.modPlateHolder, false);
    }
    if (props.modVanityPlate) {
      SetVehicleMod(vehicle, 26, props.modVanityPlate, false);
    }
    if (props.modTrimA) {
      SetVehicleMod(vehicle, 27, props.modTrimA, false);
    }
    if (props.modOrnaments) {
      SetVehicleMod(vehicle, 28, props.modOrnaments, false);
    }
    if (props.modDashboard) {
      SetVehicleMod(vehicle, 29, props.modDashboard, false);
    }
    if (props.modDial) {
      SetVehicleMod(vehicle, 30, props.modDial, false);
    }
    if (props.modDoorSpeaker) {
      SetVehicleMod(vehicle, 31, props.modDoorSpeaker, false);
    }
    if (props.modSeats) {
      SetVehicleMod(vehicle, 32, props.modSeats, false);
    }
    if (props.modSteeringWheel) {
      SetVehicleMod(vehicle, 33, props.modSteeringWheel, false);
    }
    if (props.modShifterLeavers) {
      SetVehicleMod(vehicle, 34, props.modShifterLeavers, false);
    }
    if (props.modAPlate) {
      SetVehicleMod(vehicle, 35, props.modAPlate, false);
    }
    if (props.modSpeakers) {
      SetVehicleMod(vehicle, 36, props.modSpeakers, false);
    }
    if (props.modTrunk) {
      SetVehicleMod(vehicle, 37, props.modTrunk, false);
    }
    if (props.modHydrolic) {
      SetVehicleMod(vehicle, 38, props.modHydrolic, false);
    }
    if (props.modEngineBlock) {
      SetVehicleMod(vehicle, 39, props.modEngineBlock, false);
    }
    if (props.modAirFilter) {
      SetVehicleMod(vehicle, 40, props.modAirFilter, false);
    }
    if (props.modStruts) {
      SetVehicleMod(vehicle, 41, props.modStruts, false);
    }
    if (props.modArchCover) {
      SetVehicleMod(vehicle, 42, props.modArchCover, false);
    }
    if (props.modAerials) {
      SetVehicleMod(vehicle, 43, props.modAerials, false);
    }
    if (props.modTrimB) {
      SetVehicleMod(vehicle, 44, props.modTrimB, false);
    }
    if (props.modTank) {
      SetVehicleMod(vehicle, 45, props.modTank, false);
    }
    if (props.modWindows) {
      SetVehicleMod(vehicle, 46, props.modWindows, false);
    }
    if (props.modKit47) {
      SetVehicleMod(vehicle, 47, props.modKit47, false);
    }
    if (props.modLivery) {
      SetVehicleMod(vehicle, 48, props.modLivery, false);
      SetVehicleLivery(vehicle, props.modLivery);
    }
    if (props.modKit49) {
      SetVehicleMod(vehicle, 49, props.modKit49, false);
    }
    if (props.liveryRoof) {
      SetVehicleRoofLivery(vehicle, props.liveryRoof);
    }
  }
};
Framework.Functions.LoadParticleDictionary = async (dictionary: any) => {
  if (HasNamedPtfxAssetLoaded(dictionary)) return;
  RequestNamedPtfxAsset(dictionary);
  while (!HasNamedPtfxAssetLoaded(dictionary)) {
    await Delay(10);
  }
};

Framework.Functions.GetStreetNametAtCoords = (coords: any) => {
  let streetname1: number, streetname2: number;
  [streetname1, streetname2] = GetStreetNameAtCoord(coords.x, coords.y, coords.z);
  return { main: GetStreetNameFromHashKey(streetname1), cross: GetStreetNameFromHashKey(streetname2) };
};

Framework.Functions.GetZoneAtCoords = (coords: any) => {
  return GetLabelText(GetNameOfZone(coords[0], coords[1], coords[2]));
};
Framework.Functions.GetCardinalDirection = (entity: any) => {
  entity = DoesEntityExist(entity) && entity || PlayerPedId();
  if (DoesEntityExist(entity)) {
    let heading = GetEntityHeading(entity);
    if ((heading >= 0 && heading < 45) || (heading >= 315 && heading < 360)) {
      return 'North';
    } else if (heading >= 45 && heading < 135) {
      return 'West';
    } else if (heading >= 135 && heading < 225) {
      return 'South';
    } else if (heading >= 225 && heading < 315) {
      return 'East';
    }
  } else {
    return 'Cardinal Direction Error';
  }
};
Framework.Functions.GetCurrentTime = () => {
  let obj: any = {};
  obj.min = GetClockMinutes();
  obj.hour = GetClockHours();

  if (obj.hour <= 12) {
    obj.ampm = 'AM';
  } else if (obj.hour >= 13) {
    obj.ampm = 'PM';
    obj.formattedHour = obj.hour - 12;
  }

  if (obj.min <= 9) {
    obj.min = '0' + obj.min;
  }

  return obj
};

Framework.Functions.Round = (num: number, decimalPlaces: number) => {
  if (decimalPlaces === undefined) {
    return Math.round(num);
  }
  const power = Math.pow(10, decimalPlaces);
  return Math.round(num * power) / power;
};

Framework.Functions.GetGroundHash = (entity: any) => {
  const coords = GetEntityCoords(entity, true);
  const num = StartShapeTestCapsule(coords[0], coords[1], coords[2] + 4, coords[0], coords[1], coords[2] - 2.0, 1, 1, entity, 7);
  const [retval, success, endCoords, surfaceNormal, materialHash, entityHit] = GetShapeTestResultEx(num);
  return [materialHash, entityHit, surfaceNormal, endCoords, success, retval];
};

Framework.Functions.SpawnClear = (coords: any, radius: number): boolean => {
  if (coords) {
    coords = typeof coords === 'object' ? coords : coords;
  } else {
    coords = GetEntityCoords(PlayerPedId(), true);
  }

  const vehicles = GetGamePool('CVehicle');
  const closeVeh = [];

  for (let i = 0; i < vehicles.length; i++) {
    const vehicleCoords = GetEntityCoords(vehicles[i], true);
    const distance = distanceBetweenCoords(vehicleCoords, coords);

    if (distance <= radius) {
      closeVeh.push(vehicles[i]);
    }
  }

  if (closeVeh.length > 0) {
    return false;
  }

  return true;
};



Framework.Functions.GetGroundZCoord = (coords: any) => {
  if (!coords) { return; }

  let groundZ: number;
  const retval = GetGroundZFor_3dCoord(coords[0], coords[1], coords[2], false);
  groundZ = retval[1];
  if (retval) {
    return `vector3(${coords[0]}, ${coords[1]}, ${groundZ})`;
  } else {
    return coords;
  }
};


// Events Section
onNet('Framework:Client:OnPlayerLoaded', () => {
  ShutdownLoadingScreenNui();
  LocalPlayer.state.set('isLoggedIn', true, false);
  if (!Framework.Config.Server.PVP) return;
  SetCanAttackFriendly(PlayerPedId(), true, false);
  NetworkSetFriendlyFireOption(true);
});

onNet('Framework:Client:OnPlayerUnload', () => {
  LocalPlayer.state.set('isLoggedIn', false, false);
});

onNet('Framework:Client:PvpHasToggled', (pvp_state: any) => {
  SetCanAttackFriendly(PlayerPedId(), pvp_state, false);
  NetworkSetFriendlyFireOption(pvp_state);
});

onNet('Framework:Command:TeleportToPlayer', function (coords: { x: number; y: number; z: number; }) {
  const ped = PlayerPedId();
  SetPedCoordsKeepVehicle(ped, coords.x, coords.y, coords.z);
});

onNet('Framework:Command:TeleportToCoords', function (x: number, y: number, z: number, h: any) {
  const ped = PlayerPedId();
  SetPedCoordsKeepVehicle(ped, x, y, z);
  SetEntityHeading(ped, h || GetEntityHeading(ped));
});
onNet('Framework:Command:GoToMarker', async function () {
  const blipMarker = GetFirstBlipInfoId(8);
  if (!DoesBlipExist(blipMarker)) {
    Framework.Functions.Notify("no way point", 'error', 5000);
    return 'marker';
  }

  DoScreenFadeOut(650);
  while (!IsScreenFadedOut()) {
    await Delay(100);
  }

  let ped = PlayerPedId();
  const coords = GetBlipInfoIdCoord(blipMarker);
  const vehicle = GetVehiclePedIsIn(ped, false);
  const oldCoords = GetEntityCoords(ped, true);

  let x = coords[0];
  let y = coords[1];

  const Z_START = 950.0;
  let found = false;
  let groundZ = 850.0;


  if (vehicle > 0) {
    FreezeEntityPosition(vehicle, true);
  } else {
    FreezeEntityPosition(ped, true);
  }

  for (let i = Z_START; i >= 0; i -= 25.0) {
    let z = i;
    if (i % 2 !== 0) {
      z = Z_START - i;
    }

    NewLoadSceneStart(x, y, z, x, y, z, 50.0, 0);
    const curTime = GetGameTimer();
    while (IsNetworkLoadingScene()) {
      if (GetGameTimer() - curTime > 1000) {
        break;
      }
      await Delay(100);
    }
    NewLoadSceneStop();
    SetPedCoordsKeepVehicle(ped, x, y, z);



    while (!HasCollisionLoadedAroundEntity(ped)) {
      RequestCollisionAtCoord(x, y, z);
      if (GetGameTimer() - curTime > 1000) {
        break;
      }
      await Delay(100);
    }

    const groundResult = GetGroundZFor_3dCoord(x, y, z, false);
    found = groundResult[0];
    groundZ = groundResult[1];

    if (found) {
      await Delay(100);
      SetPedCoordsKeepVehicle(ped, x, y, groundZ);
      break;
    }
    await Delay(100);
  }
  DoScreenFadeIn(650);
  if (vehicle > 0) {
    FreezeEntityPosition(vehicle, false);
  } else {
    FreezeEntityPosition(ped, false);
  }

  if (!found) {
    SetPedCoordsKeepVehicle(ped, oldCoords[0], oldCoords[1], oldCoords[2] - 1.0);
    Framework.Functions.Notify("Can teleport", 'error', 5000);
  }

  SetPedCoordsKeepVehicle(ped, x, y, groundZ);
  Framework.Functions.Notify("Teleported", 'success', 5000);
});

onNet('Framework:Command:SpawnVehicle', async function (vehName: any) {
  const ped = PlayerPedId();
  const hash = joaat(vehName);
  const veh = GetVehiclePedIsUsing(ped);
  if (!IsModelInCdimage(hash)) return;
  RequestModel(hash);
  while (!HasModelLoaded(hash)) {
    await Delay(100);
  }

  if (IsPedInAnyVehicle(ped, false)) {
    SetEntityAsMissionEntity(veh, true, true);
    DeleteVehicle(veh);
  }
  const coords = GetEntityCoords(ped, true)
  const vehicle = CreateVehicle(hash, coords[0], coords[1], coords[2], GetEntityHeading(ped), true, false);
  TaskWarpPedIntoVehicle(ped, vehicle, -1);
  SetVehicleFuelLevel(vehicle, 100.0);
  SetVehicleDirtLevel(vehicle, 0.0);
  SetModelAsNoLongerNeeded(hash);
  TriggerEvent('vehiclekeys:client:SetOwner', Framework.Functions.GetPlate(vehicle));
});
function joaat(vehName: any): number {
  let hash = 0;
  for (let i = 0; i < vehName.length; i++) {
    hash += vehName.charCodeAt(i);
    hash += (hash << 10);
    hash ^= (hash >> 6);
  }
  hash += (hash << 3);
  hash ^= (hash >> 11);
  hash += (hash << 15);
  return hash >>> 0;
};

onNet('Framework:Command:DeleteVehicle', function () {
  const ped = PlayerPedId();
  const veh = GetVehiclePedIsUsing(ped);
  if (veh !== 0) {
    SetEntityAsMissionEntity(veh, true, true);
    DeleteVehicle(veh);
  } else {
    const pcoords = GetEntityCoords(ped, true);
    const vehicles = GetGamePool('CVehicle');
    for (const v of vehicles) {
      const coords = GetEntityCoords(v, true);
      if (Vdist(pcoords[0], pcoords[1], pcoords[2], coords[0], coords[1], coords[2]) <= 5.0) {
        SetEntityAsMissionEntity(v, true, true);
        DeleteVehicle(v);
      }
    }
  }
});
onNet('Framework:Client:VehicleInfo', function (info: any) {
  const plate = Framework.Functions.GetPlate(info.vehicle);
  let hasKeys = true;

  if (GetResourceState('qb-vehiclekeys') == 'started') {
    hasKeys = exports['qb-vehiclekeys'].HasKeys();
  }

  const data = {
    vehicle: info.vehicle,
    seat: info.seat,
    name: info.modelName,
    plate: plate,
    driver: GetPedInVehicleSeat(info.vehicle, -1),
    inseat: GetPedInVehicleSeat(info.vehicle, info.seat),
    haskeys: hasKeys
  };

  TriggerEvent('Framework:Client:' + info.event + 'Vehicle', data);
});
onNet('Framework:Player:SetPlayerData', function (val: any) {
  Framework.PlayerData = val
});
onNet('Framework:Player:UpdatePlayerData', function () {
  TriggerServerEvent('Framework:UpdatePlayer')
});
onNet('Framework:Notify', function (text: any, type: any, length: any, icon: any) {
  Framework.Functions.Notify(text, type, length, icon)
});
onNet('Framework:Client:TriggerClientCallback', function (name: any, ...args: any) {
  Framework.Functions.TriggerClientCallback(name, (...args: any[]) => {
    TriggerServerEvent('Framework:Server:TriggerClientCallback', name, ...args);
  }, ...args);
});
onNet('Framework:Client:TriggerCallback', function (name: any, ...args: any) {
  if (Framework.ServerCallbacks[name]) {
    Framework.ServerCallbacks[name](...args);
    Framework.ServerCallbacks[name] = null;
  }
});

onNet('Framework:Client:OnSharedUpdate', function (tableName: any, key: any, value: any) {
  Framework.Shared[tableName][key] = value
  TriggerEvent('Framework:Client:UpdateObject')
});
onNet('Framework:Client:OnSharedUpdateMultiple', function (tableName: any, values: any) {
  for (const [key, value] of Object.entries(values)) {
    Framework.Shared[tableName][key] = value;
  }
  TriggerEvent('Framework:Client:UpdateObject');
});
onNet('Framework:Client:SharedUpdate', function (table: any) {
  Framework.Shared = table
});

global.exports("GetCoreObject", () => Framework);