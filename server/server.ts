
let Framework: any = {};
import { oxmysql as MySQL } from "@overextended/oxmysql";
export const QBConfig = JSON.parse(
  LoadResourceFile(GetCurrentResourceName(), "config.json")
);
export const QBShared = JSON.parse(
  LoadResourceFile(GetCurrentResourceName(), "shared.json")
);
function Delay(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}
// import { QBShared } from "../shared/shared";

Framework.PlayerData = {} as any; // Initialize Framework.PlayerData as an empty object
Framework.Config = QBConfig;
Framework.Shared = QBShared;
Framework.Players = Framework.Players || {} as any;
Framework.Player = Framework.Player || {} as any;
Framework.ClientCallbacks = Framework.ClientCallbacks || {} as any;
Framework.ServerCallbacks = Framework.ServerCallbacks || {} as any;
Framework.Functions = Framework.Functions || {} as any;
Framework.Player_Buckets = Framework.Player_Buckets || {} as any;
Framework.Entity_Buckets = Framework.Entity_Buckets || {} as any;
Framework.Commands = Framework.Commands || {} as any;
Framework.Commands.IgnoreList = {
  "god": true,
  "user": true,
};
Framework.Commands.List = Framework.Commands.List || {} as any;
const resourceName = GetCurrentResourceName();
function randomStr(length: any) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
function randomInt(min: any, max: any) {
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}
Framework.Debug = (tbl: any, indent?: number) => {
  const resource = GetInvokingResource() ?? 'qb-core';
  emit('Framework:DebugSomething', tbl, indent, resource);
};

// Functions Section
Framework.Functions.GetCoords = (entity: any) => {
  const coords = GetEntityCoords(entity); // Assuming this function returns an object with x, y, z properties
  const heading = GetEntityHeading(entity);
  // Assuming Vector4 is a type or interface you have defined to hold these values
  return `vector4(${coords[0]}, ${coords[1]}, ${coords[2]}, ${heading})`;
};

Framework.Functions.GetBucketObjects = () => {
  return Framework.Player_Buckets, Framework.Entity_Buckets;
};

Framework.Functions.CreateUseableItem = (item: any, data: any) => {
  exports["inventory"].addUsableItem(item, data)
};

Framework.Functions.GetIdentifier = (source: any, idtype: any = "license") => {
  if (GetConvarInt("sv_fxdkMode", 0) === 1) {
    return "license:fxdk";
  }
  return GetPlayerIdentifierByType(source, idtype);
};

Framework.Functions.SetEntityBucket = (entity: any, bucket: any) => {
  if (entity && bucket !== undefined) {
    SetEntityRoutingBucket(entity, bucket);
    Framework.Entity_Buckets[entity] = { id: entity, bucket: bucket };
    return true;
  } else {
    return false;
  }
};

Framework.Functions.SetPlayerBucket = (source: any, bucket: any) => {
  if (source && bucket !== undefined) {
    const plicense: any = Framework.Functions.GetIdentifier(source, 'license');
    SetPlayerRoutingBucket(source, bucket);
    Framework.Player_Buckets[plicense] = { id: source, bucket: bucket };
    return true;
  } else {
    return false;
  }
};

Framework.Functions.GetSource = (identifier: any) => {
  const players = Object.keys(Framework.Players); // Assuming Framework.Players is an object with sources as keys

  for (let i = 0; i < players.length; i++) {
    const src = players[i];
    const idens = getPlayerIdentifiers(src); // Assuming GetPlayerIdentifiers is available in the global scope

    for (let j = 0; j < idens.length; j++) {
      if (identifier === idens[j]) {
        return src;
      }
    }
  }
  return 0; // Return 0 if no matching source is found
};

Framework.Functions.AddPlayerMethod = (ids: any | number[], methodName: any, handler: (...args: any[]) => any) => {
  if (typeof ids === "number") {
    if (ids === -1) {
      Object.values(Framework.Players).forEach((player: any) => {
        player.Functions[methodName] = handler;
      });
    } else {
      const player = Framework.Players[ids];
      if (player) {
        player.Functions[methodName] = handler;
      }
    }
  } else if (Array.isArray(ids)) {
    ids.forEach((id) =>
      Framework.Functions.AddPlayerMethod(id, methodName, handler)
    );
  }
};

Framework.Functions.CreatePhoneNumber = async () => {
  let uniqueFound = false;
  let phoneNumber = "";
  if (!uniqueFound) {
    phoneNumber = `${randomInt(10000000, 99999999)}`;
    const result: any = await MySQL.query("SELECT COUNT(*) as count FROM players WHERE charinfo LIKE ?", [phoneNumber]);
    if (result && result[0]?.count === 0) {
      uniqueFound = true;
    }
  }
  return phoneNumber
};

Framework.Functions.CreateAccountNumber = async () => {
  let uniqueFound = false;
  let accountNumber = "";
  if (!uniqueFound) {
    accountNumber = `KSVEC${randomInt(1000000000, 9999999999)}`;
    const result: any = await MySQL.query("SELECT COUNT(*) as count FROM players WHERE charinfo LIKE ?", [accountNumber]);
    if (result && result[0]?.count === 0) {
      uniqueFound = true;
    }
  }

  return accountNumber;
};

Framework.Functions.AddPlayerField = (ids: any | number[], fieldName: any, data: any) => {
  if (typeof ids === "number") {
    if (ids === -1) {
      Object.values(Framework.Players).forEach((player: any) => {
        player[fieldName] = data;
      });
    } else {
      const player = Framework.Players[ids];
      if (player) {
        player[fieldName] = data;
      }
    }
  } else if (Array.isArray(ids)) {
    ids.forEach((id) =>
      Framework.Functions.AddPlayerField(id, fieldName, data)
    );
  }
};

Framework.Functions.HasItem = (source: any | string, items: any | string[], amount: any = 1) => {
  try {
    const result: boolean = global.exports["inventory"].HasItem(
      source,
      items,
      amount
    );
    return result;
  } catch (error) {
    console.error("Error checking item in qb-inventory:", error);
    return false;
  }
};

Framework.Functions.GetPlayer = (source: any) => {
  if (source) {
    return Framework.Players[source];
  } else {
    return Framework.Players[Framework.Functions.GetSource(source)];
  }
};

Framework.Functions.GetPlayerByCitizenId = (citizenid: any) => {
  for (const src in Framework.Players) {
    const player = Framework.Players[src];
    if (
      player &&
      player.PlayerData &&
      player.PlayerData.citizenid === citizenid
    ) {
      return player;
    }
  }
  return null;
};

Framework.Functions.GetOfflinePlayerByCitizenId = (citizenid: any) => {
  return Framework.Player.GetOfflinePlayer(citizenid);
};

Framework.Functions.GetPlayerByLicense = (license: any) => {
  return Framework.Player.GetPlayerByLicense(license);
};

Framework.Functions.GetPlayerByPhone = (number: any) => {
  for (const src of Object.keys(Framework.Players)) {
    if (Framework.Players[src].PlayerData.charinfo.phone === number) {
      return Framework.Players[src];
    }
  }
  return null;
};

Framework.Functions.GetPlayerByAccount = (account: any) => {
  for (const src of Object.keys(Framework.Players)) {
    const player = Framework.Players[src];
    if (player.PlayerData.charinfo.account === account) {
      return player;
    }
  }
  return null;
};

Framework.Functions.GetPlayerByCharInfo = (property: any, value: any) => {
  for (const src of Object.keys(Framework.Players)) {
    const charinfo = Framework.Players[src].PlayerData.charinfo;
    if (charinfo[property] !== undefined && charinfo[property] === value) {
      return Framework.Players[src];
    }
  }
  return null;
};

Framework.Functions.GetPlayers = (): number[] => {
  let sources: number[] = [];
  for (const source in Framework.Players) {
    sources.push(Number(source));
  }
  return sources;
};

Framework.Functions.GetQBPlayers = () => {
  return Framework.Players;
};

Framework.Functions.GetPlayersByJob = (job: any) => {
  const players: any[] = [];
  for (const src in Framework.Players) {
    const player = Framework.Players[src];
    if (player.PlayerData.job.name === job) {
      players.push(src);
    }
  }
  return players;
};

Framework.Functions.GetPlayersOnDuty = (job: any) => {
  const players: any[] = [];
  let count = 0;

  for (const src in Framework.Players) {
    const player = Framework.Players[src];
    if (player.PlayerData.job.name === job && player.PlayerData.job.onduty) {
      players.push(src);
      count++;
    }
  }

  return [players, count];
};

Framework.Functions.GetDutyCount = (job: any) => {
  let count = 0;
  for (const player of Object.values(Framework.Players) as any) {
    if (player.PlayerData.job.name === job && player.PlayerData.job.onduty) {
      count++;
    }
  }
  return count;
};

Framework.Functions.GetPlayersInBucket = (bucket: any) => {
  const currBucketPool: any[] = [];

  if (Framework.Player_Buckets && Object.keys(Framework.Player_Buckets).length > 0) {
    Object.values(Framework.Player_Buckets).forEach((info: any) => {
      if (info.bucket === bucket) {
        currBucketPool.push(info.id);
      }
    });
    return currBucketPool;
  } else {
    return false;
  }
};

Framework.Functions.GetEntitiesInBucket = (bucket: any) => {
  const currBucketPool: any[] = [];
  if (Framework.Entity_Buckets && Object.keys(Framework.Entity_Buckets).length > 0) {
    for (const info of Object.values(Framework.Entity_Buckets) as any) {
      if (info.bucket === bucket) {
        currBucketPool.push(info.id);
      }
    }
    return currBucketPool;
  } else {
    return false;
  }
};

Framework.Functions.SpawnVehicle = (source: any, model: any | number, coords: any, warp: boolean) => {
  const ped = GetPlayerPed(source.toString());
  model = typeof model === "string" ? GetHashKey(model) : model;
  if (!coords) {
    coords = GetEntityCoords(ped);
  }
  const heading = coords.w || 0.0;
  const veh = CreateVehicle(model, coords.x, coords.y, coords.z, heading, true, false);

  const newtick = setTick(() => {
    if (!DoesEntityExist(veh)) return;
    if (warp) {
      const currentVeh = GetVehiclePedIsIn(ped, false);
      if (currentVeh !== veh) {
        TaskWarpPedIntoVehicle(ped, veh, -1);
        return;
      }
    }
    const owner = NetworkGetEntityOwner(veh);
    if (owner !== source) return;

    clearTick(newtick);
  });

  return veh;
};

Framework.Functions.CreateAutomobile = (source: any, model: any | number, coords: any, warp: boolean) => {
  model = typeof model === "string" ? GetHashKey(model) : model;
  if (!coords) {
    coords = GetEntityCoords(GetPlayerPed(source.toString()));
  }
  const heading = coords.w ?? 0.0;
  const CREATE_AUTOMOBILE: any = "CREATE_AUTOMOBILE";
  const veh: any = Citizen.invokeNative(CREATE_AUTOMOBILE as any, model, coords.x, coords.y, coords.z, heading, true, true);
  const checkVehExists = () => new Promise<void>((resolve) => {
    setTick(() => {
      if (DoesEntityExist(veh)) {
        resolve();
        clearTick(parseInt(checkVehExists.toString()));
      }
    });
  });
  checkVehExists();
  if (warp) {
    TaskWarpPedIntoVehicle(GetPlayerPed(source.toString()), veh, -1);
  }
  return veh;
};

Framework.Functions.CreateVehicle = (source: any, model: any | number, vehtype: any | number, coords: any, warp: boolean) => {
  model = typeof model === "string" ? GetHashKey(model) : model;
  vehtype = typeof vehtype === "string" ? vehtype : vehtype.toString();

  if (!coords) {
    coords = GetEntityCoords(GetPlayerPed(source.toString()));
  }

  const heading = coords.w ?? 0.0;
  const veh = CreateVehicle(model, vehtype, coords[0], coords[1], coords[2], heading, true);
  const waitForVehicleToExist = () => {
    return new Promise<void>((resolve) => {
      const checkExistence = setTick(() => {
        if (DoesEntityExist(veh)) {
          clearTick(checkExistence);
          resolve();
        }
      });
    });
  };
  return waitForVehicleToExist().then(() => {
    if (warp) {
      TaskWarpPedIntoVehicle(GetPlayerPed(source.toString()), veh, -1);
    }
    return veh;
  });
};

Framework.Functions.TriggerCallback = (name: any, source: any, cb: (...args: any[]) => void, ...args: any[]) => {
  const callback = Framework.ServerCallbacks[name];
  if (!callback) {
    console.error(`Callback ${name} not found.`);
    return;
  }

  callback(source, cb, ...args);
};

Framework.Functions.TriggerClientCallback = (name: any, source: any, cb: (...args: any[]) => void, ...args: any[]) => {
  Framework.ClientCallbacks[name] = cb;
  TriggerClientEvent("Framework:Client:TriggerClientCallback", source, name, ...args);
};

Framework.Functions.CreateCallback = (name: any, cb: any) => {
  Framework.ServerCallbacks[name] = cb;
};

Framework.Functions.UseItem = (source: any, item: any) => {
  exports["inventory"].useItem(source, item)
};

Framework.Functions.Kick = (source: any, reason: any, setKickReason?: (reason: any) => void, deferrals?: { update: (message: any) => void }) => {
  reason = `\n${reason}\n🔸 Check our Discord for further information: ${Framework.Config.Server.Discord}`;
  if (setKickReason) {
    setKickReason(reason);
  }

  const handleKick = () => {
    if (source) {
      DropPlayer(source.toString(), reason);
    }
    if (deferrals) {
      deferrals.update(reason);
      new Promise((resolve) => setTimeout(resolve, 2500));
    }
    for (let i = 0; i < 5; i++) {
      new Promise((resolve) => setTimeout(resolve, 5000));
      if (GetPlayerPing(source.toString()) >= 0) {
        DropPlayer(source.toString(), reason);
      }
    }
  };

  handleKick();
};

Framework.Functions.IsWhitelisted = (source: any) => {
  if (!Framework.Config.Server.Whitelist) {
    return true;
  }

  if (Framework.Functions.HasPermission(source, Framework.Config.Server.WhitelistPermission)) {
    return true;
  }

  return false;
};

Framework.Functions.AddPermission = (source: any, permission: any) => {
  if (!IsPlayerAceAllowed(source.toString(), permission)) {
    const command = `add_principal player.${source} Framework.${permission}`;
    ExecuteCommand(command);
    Framework.Commands.Refresh(source);
  }
};

Framework.Functions.RemovePermission = (source: any, permission?: any) => {
  if (permission) {
    if (IsPlayerAceAllowed(source.toString(), permission)) {
      ExecuteCommand(`remove_principal player.${source} Framework.${permission}`);
      if (Framework.Commands && typeof Framework.Commands.Refresh === "function") {
        Framework.Commands.Refresh(source);
      }
    }
  } else {
    Object.values(Framework.Config.Server.Permissions).forEach((perm: any) => {
      if (IsPlayerAceAllowed(source.toString(), perm)) {
        ExecuteCommand(`remove_principal player.${source} Framework.${perm}`);
        if (Framework.Commands && typeof Framework.Commands.Refresh === "function") {
          Framework.Commands.Refresh(source);
        }
      }
    });
  }
};

Framework.Functions.HasPermission = (source: any, permission: any) => {
  if (IsPlayerAceAllowed(source.toString(), permission)) {
    return true;
  }
  return false;
};

Framework.Functions.GetPermission = (source: any) => {
  const permissions: Record<string, boolean> = {};
  Framework.Config.Server.Permissions.forEach((permission: any) => {
    if (IsPlayerAceAllowed(source.toString(), permission)) {
      permissions[permission] = true;
    }
  });

  return permissions;
};

Framework.Functions.IsOptin = (source: any) => {
  const license = Framework.Functions.GetIdentifier(source, "license");

  if (!license || !Framework.Functions.HasPermission(source, "admin")) {
    return false;
  }

  const player = Framework.Functions.GetPlayer(source);

  return player ? player.PlayerData.optin : false;
};

Framework.Functions.ToggleOptin = (source: any) => {
  const license = Framework.Functions.GetIdentifier(source, "license");

  if (!license || !Framework.Functions.HasPermission(source, "admin")) {
    return;
  }

  const player = Framework.Functions.GetPlayer(source);
  if (!player) {
    console.error(`Player not found for source: ${source}`);
    return;
  }

  player.PlayerData.optin = !player.PlayerData.optin;
  if (player.Functions.SetPlayerData) {
    player.Functions.SetPlayerData("optin", player.PlayerData.optin);
  } else {
    console.error("SetPlayerData function not found for player:", player);
  }
};

Framework.Functions.IsPlayerBanned = (source: any) => {
  const plicense = Framework.Functions.GetIdentifier(source, "license");
  if (!plicense) {
    return false;
  }

  try {
    const result: any = MySQL.query("SELECT * FROM bans WHERE license = ?", [plicense]);

    if (result?.length === 0) return false;

    const ban = result && result[0];
    if (Date.now() < ban.expire * 1000) {
      const expireDate = new Date(ban.expire * 1000);
      const formattedExpireDate = `${expireDate.getDate()}/${expireDate.getMonth() + 1}/${expireDate.getFullYear()} ${expireDate.getHours()}:${expireDate.getMinutes()}`;
      return true;
    } else {
      MySQL.query("DELETE FROM bans WHERE id = ?", [ban.id]);
    }
  } catch (error) {
    console.error("Error checking player ban status:", error);
  }

  return false;
};

Framework.Functions.IsLicenseInUse = (license: any) => {
  const players = Framework.Functions.GetPlayers();
  for (const player of players) {
    const playerLicense = Framework.Functions.GetIdentifier(player, "license");
    if (playerLicense === license) {
      return true;
    }
  }
  return false;
};

Framework.Functions.Notify = (source: any, text: any, type: any, length: any) => {
  TriggerClientEvent("Framework:Notify", source, text, type, length);
};

Framework.Functions.PrepForSQL = (source: any, data: any, pattern: any) => {
  const dataStr = data.toString();
  const player = Framework.Functions.GetPlayer(source);

  const regex = new RegExp(pattern);
  const result = dataStr.match(regex);

  if (!result || result[0].length !== dataStr.length) {
    const logMessage = `${player.PlayerData.license} attempted to exploit SQL!`;
    emit("qb-log:server:CreateLog", "anticheat", "SQL Exploit Attempted", "red", logMessage);
    return false;
  }

  return true;
};
Framework.Functions.CreateCallback('Framework:Server:SpawnVehicle', async (source: number, cb: Function, model: string, coords: { x: number; y: number; z: number; heading?: number }, warp: boolean) => {
  const veh = Framework.Functions.SpawnVehicle(source, model, coords, warp); // Assuming this function is async and returns a vehicle entity
  const networkId = NetworkGetNetworkIdFromEntity(veh);
  cb(networkId);
});
Framework.Functions.CreateCallback('Framework:Server:CreateVehicle', async (source: number, cb: Function, model: string, coords: { x: number; y: number; z: number; heading?: number }, warp: boolean) => {
  const veh = await Framework.Functions.CreateAutomobile(source, model, coords, warp); // Assuming this function is async and returns a vehicle entity
  const networkId = NetworkGetNetworkIdFromEntity(veh);
  cb(networkId);
});
// Commands Sections
// setImmediate(() => {
//   console.log(`[qb-core] Setting up permissions...`);
//   const permissions: string[] = Framework.Config.Server.Permissions;
//   permissions.forEach((permission) => {
//     const command = `add_ace Framework.${permission} ${permission} allow`;
//     ExecuteCommand(command);
//   });
// })
Framework.Commands.Add = (name: string, help: string, argumentsArray: any[], argsRequired: boolean, callback: Function, permission: string = "user", ...extraPermissions: string[]) => {
  const restricted = permission !== "user";
  const permissions: string[] = extraPermissions.length > 0 ? [...extraPermissions, permission] : [permission];

  RegisterCommand(name, (source: any, args: any, rawCommand: any) => {
    if (argsRequired && args.length < argumentsArray.length) {
      TriggerClientEvent("chat:addMessage", source, {
        color: [255, 0, 0],
        multiline: true,
        args: ["System", "Missing required arguments."]
      });
      return;
    }
    callback(source, args, rawCommand);
  }, restricted);

  permissions.forEach((perm) => {
    if (!(Framework.Commands.IgnoreList as Record<string, boolean>)[perm.toLowerCase()]) {
      ExecuteCommand(`add_ace Framework.${perm.toLowerCase()} command.${name} allow`);
    }
  });

  Framework.Commands.List[name.toLowerCase()] = {
    name: name.toLowerCase(),
    permission: permissions.length === 1 ? permissions[0] : permissions,
    help,
    arguments: argumentsArray,
    argsRequired,
    callback,
  };
};

Framework.Commands.Refresh = (source: number) => {
  const player = Framework.Functions.GetPlayer(source);
  const suggestions: Array<{ name: string; help: string; params: any[] }> = [];

  if (player) {
    Object.entries(Framework.Commands.List).forEach(([command, info]: [any, any]) => {
      const hasPerm = IsPlayerAceAllowed(source.toString(), `command.${command}`);
      if (hasPerm) {
        suggestions.push({
          name: `/${command}`,
          help: info.help,
          params: info.arguments
        });
      } else {
        emit('chat:removeSuggestion', source, `/${command}`);
      }
    });

    emit('chat:addSuggestions', source, suggestions);
  }
};

// Players Sections

Framework.Player.Login = async function (source: any, citizenid: any, newData: any) {
  if (source && source !== '') {
    if (citizenid) {
      const license = Framework.Functions.GetIdentifier(source, 'license'); // Assuming this function is available/synchronous
      const playerDataRows = await MySQL.query('SELECT * FROM players WHERE citizenid = ?', [citizenid]);
      const playerData = playerDataRows && playerDataRows[0];

      if (playerData && license === playerData.license) {
        // Parse stored JSON strings to objects
        playerData.money = JSON.parse(playerData.money || '{}');
        playerData.job = JSON.parse(playerData.job || '{}');
        playerData.position = JSON.parse(playerData.position || '{}');
        playerData.metadata = JSON.parse(playerData.metadata || '{}');
        playerData.charinfo = JSON.parse(playerData.charinfo || '{}');
        playerData.gang = playerData.gang ? JSON.parse(playerData.gang) : {};
        Framework.Player.CheckPlayerData(source, playerData);
      } else {
        DropPlayer(source, "You've been dropped due to a character joining exploit."); // Adapting Lang:t usage
        TriggerEvent('qb-log:server:CreateLog', 'anticheat', 'Anti-Cheat', 'white', `${GetPlayerName(source)} Has Been Dropped For Character Joining Exploit`, false);
      }
    } else {
      Framework.Player.CheckPlayerData(source, newData);
    }
    return true;
  } else {
    console.error(`${resourceName}: ERROR Framework.PLAYER.LOGIN - NO SOURCE GIVEN!`); // Example adaptation of Framework.ShowError
    return false;
  }
};

Framework.Player.GetOfflinePlayer = async (citizenid: any) => {
  if (citizenid) {
    const playerDataRows = await MySQL.query('SELECT * FROM players WHERE citizenid = ?', [citizenid]);
    const playerData = playerDataRows && playerDataRows[0]; // Assuming citizenid uniquely identifies a player

    if (playerData) {
      // Parse JSON fields to convert them back to objects
      playerData.money = JSON.parse(playerData.money || '{}');
      playerData.job = JSON.parse(playerData.job || '{}');
      playerData.position = JSON.parse(playerData.position || '{}');
      playerData.metadata = JSON.parse(playerData.metadata || '{}');
      playerData.charinfo = JSON.parse(playerData.charinfo || '{}');
      playerData.gang = playerData.gang ? JSON.parse(playerData.gang) : {};

      // Assuming checkPlayerData is adapted to JavaScript and handles the player data setup or validation
      return Framework.Player.CheckPlayerData(null, playerData);
    }
  }
  return null;
};

Framework.Player.GetPlayerByLicense = async (license: string) => {
  if (license) {
    const playerDataRows = await MySQL.query('SELECT * FROM players WHERE license = ?', [license]);
    const playerData = playerDataRows && playerDataRows[0]; // Assuming the license is unique and only one record should be returned

    if (playerData) {
      // Assuming the data stored in the database is stringified JSON for these fields
      playerData.money = JSON.parse(playerData.money || '{}');
      playerData.job = JSON.parse(playerData.job || '{}');
      playerData.position = JSON.parse(playerData.position || '{}');
      playerData.metadata = JSON.parse(playerData.metadata || '{}');
      playerData.charinfo = JSON.parse(playerData.charinfo || '{}');
      playerData.gang = playerData.gang ? JSON.parse(playerData.gang) : {};

      // Assuming checkPlayerData is adapted to JavaScript and handles the player data setup or validation
      return Framework.Player.CheckPlayerData(null, playerData); // This assumes checkPlayerData can be called with these arguments
    }
  }
  return null;
};

Framework.Player.CheckPlayerData = async (source: any, playerData: any = {}) => {
  let offline: boolean = true;
  if (source) {
    playerData.source = source;
    playerData.license = playerData.license || Framework.Functions.GetIdentifier(source, 'license');
    playerData.name = GetPlayerName(source);
    offline = false;
  }
  playerData.citizenid = playerData.citizenid || await Framework.Player.CreateCitizenId();
  playerData.cid = playerData.cid || 1;
  playerData.money = playerData.money || {};
  playerData.optin = playerData.optin !== undefined ? playerData.optin : true;

  // Initialize money types with default values
  Object.entries(Framework.Config.Money.MoneyTypes).forEach(([moneyType, startAmount]) => {
    playerData.money[moneyType] = playerData.money[moneyType] || startAmount;
  });

  // Initialize charinfo with default values
  playerData.charinfo = playerData.charinfo || {};
  playerData.charinfo.firstname = playerData.charinfo.firstname || 'Firstname';
  playerData.charinfo.lastname = playerData.charinfo.lastname || 'Lastname';
  playerData.charinfo.birthdate = playerData.charinfo.birthdate || '00-00-0000';
  playerData.charinfo.gender = playerData.charinfo.gender || 0;
  playerData.charinfo.backstory = playerData.charinfo.backstory || "placeholder backstory";
  playerData.charinfo.nationality = playerData.charinfo.nationality || "USA";
  playerData.charinfo.phone = playerData.charinfo.phone || await Framework.Functions.CreatePhoneNumber();
  playerData.charinfo.account = playerData.charinfo.account || await Framework.Functions.CreateAccountNumber();
  // Initialize metadata with default values and ensure types are correct
  playerData.metadata = playerData.metadata || {};
  playerData.metadata.hunger = playerData.metadata.hunger || 100;
  playerData.metadata.thirst = playerData.metadata.thirst || 100;
  playerData.metadata.stress = playerData.metadata.stress || 0;
  playerData.metadata.isdead = playerData.metadata.isdead || false;
  playerData.metadata.inlaststand = playerData.metadata.inlaststand || false;
  playerData.metadata.armor = playerData.metadata.armor || 0;
  playerData.metadata.ishandcuffed =
    playerData.metadata.ishandcuffed || false;
  playerData.metadata.tracker = playerData.metadata.tracker || false;
  playerData.metadata.injail = playerData.metadata.injail || 0;
  playerData.metadata.jailitems = playerData.metadata.jailitems || {};
  playerData.metadata.status = playerData.metadata.status || {};
  playerData.metadata.phone = playerData.metadata.phone || {};
  playerData.metadata.fitbit = playerData.metadata.fitbit || {};
  playerData.metadata.bloodtype = playerData.metadata.bloodtype || Framework.Config.Player.Bloodtypes[Math.floor(Math.random() * Framework.Config.Player.Bloodtypes.length)];
  playerData.metadata.dealerrep = playerData.metadata.dealerrep || 0;
  playerData.metadata.craftingrep = playerData.metadata.craftingrep || 0;
  playerData.metadata.attachmentcraftingrep = playerData.metadata.attachmentcraftingrep || 0;
  playerData.metadata.currentapartment = playerData.metadata.currentapartment || null;
  playerData.metadata.jobrep = playerData.metadata.jobrep || {};
  playerData.metadata.jobrep.tow = playerData.metadata.jobrep.tow || 0;
  playerData.metadata.jobrep.trucker = playerData.metadata.jobrep.trucker || 0;
  playerData.metadata.jobrep.taxi = playerData.metadata.jobrep.taxi || 0;
  playerData.metadata.jobrep.hotdog = playerData.metadata.jobrep.hotdog || 0;
  playerData.metadata.callsign = playerData.metadata.callsign || "NO CALLSIGN";
  playerData.metadata.fingerprint = playerData.metadata.fingerprint || await Framework.Player.CreateFingerId();
  playerData.metadata.walletid = playerData.metadata.walletid || await Framework.Player.CreateWalletId();
  playerData.metadata.criminalrecord = playerData.metadata.criminalrecord || {
    hasRecord: false,
    date: null,
  };
  playerData.metadata.licences = playerData.metadata.licences || {
    driver: true,
    business: false,
    weapon: false,
  };
  playerData.metadata.inside = playerData.metadata.inside || {
    house: null,
    apartment: { apartmentType: null, apartmentId: null },
  };
  playerData.metadata.phonedata = playerData.metadata.phonedata || {
    SerialNumber: await Framework.Player.CreateSerialNumber(),
    InstalledApps: [],
  };

  if (playerData.job && playerData.job.name && !Framework.Shared.Jobs[playerData.job.name]) {
    playerData.job = null;
  }
  playerData.job = playerData.job || { name: 'unemployed', label: 'Civilian', payment: 10, type: 'none' };

  if (!playerData.job.onduty || Framework.Shared.ForceJobDefaultDutyAtLogin) {
    playerData.job.onduty = Framework.Shared.Jobs[playerData.job.name]?.defaultDuty || false;
  }
  playerData.job.isboss = playerData.job.isboss || false;
  playerData.job.grade = playerData.job.grade || { name: 'Freelancer', level: 0 };

  // Gang Setup
  if (playerData.gang && playerData.gang.name && !Framework.Shared.Gangs[playerData.gang.name]) {
    playerData.gang = null;
  }
  playerData.gang = playerData.gang || { name: 'none', label: 'No Gang Affiliation', isboss: false, grade: { name: 'none', level: 0 } };

  // Position and Items Setup
  playerData.position = playerData.position || Framework.Config.DefaultSpawn;

  // Load player items if the qb-inventory resource is available
  if (GetResourceState('qb-inventory') !== 'missing') {
    // Assuming exports['qb-inventory'].LoadInventory returns an array or object representing the player's inventory
    playerData.items = exports['qb-inventory'].LoadInventory(playerData.source, playerData.citizenid);
  } else {
    playerData.items = [];
  }
  // This placeholder simulates the creation or fetching of a player object with the enriched data.
  // Implement Framework.Player.CreatePlayer according to your project's structure.
  return Framework.Player.CreatePlayer(playerData, offline);
};
declare const Wait: (ms: number) => void;

Framework.Player.Logout = async (source: any) => {
  TriggerClientEvent("Framework:Client:OnPlayerUnload", source);
  TriggerEvent("Framework:Server:OnPlayerUnload", source);
  TriggerClientEvent("Framework:Player:UpdatePlayerData", source);
  await Delay(2000);
  delete Framework.Players[source];
};

Framework.Player.CreatePlayer = (playerData: any, offline: boolean) => {
  let self: any = {};
  self.PlayerData = playerData;
  self.Offline = offline;
  self.Functions = {} as any;
  self.Functions.UpdatePlayerData = () => {
    if (self.Offline) return;
    TriggerEvent("Framework:Player:SetPlayerData", self.PlayerData);
    TriggerClientEvent(
      "Framework:Player:SetPlayerData",
      self.PlayerData.source,
      self.PlayerData
    );
  };
  self.Functions.SetJob = (job: any, grade: any) => {
    job = job.toLowerCase();
    grade = grade.toString() || "0";
    if (!Framework.Shared.Jobs[job]) {
      return false;
    }
    self.PlayerData.job.name = job;
    self.PlayerData.job.label = Framework.Shared.Jobs[job].label;
    self.PlayerData.job.onduty = Framework.Shared.Jobs[job].defaultDuty;
    self.PlayerData.job.type = Framework.Shared.Jobs[job].type || "none";
    if (Framework.Shared.Jobs[job].grades[grade]) {
      const jobgrade = Framework.Shared.Jobs[job].grades[grade];
      self.PlayerData.job.grade = {};
      self.PlayerData.job.grade.name = jobgrade.name;
      self.PlayerData.job.grade.level = parseInt(grade);
      self.PlayerData.job.payment = jobgrade.payment || 30;
      self.PlayerData.job.isboss = jobgrade.isboss || false;
    } else {
      self.PlayerData.job.grade = {};
      self.PlayerData.job.grade.name = "No Grades";
      self.PlayerData.job.grade.level = 0;
      self.PlayerData.job.payment = 30;
      self.PlayerData.job.isboss = false;
    }

    if (!self.Offline) {
      self.Functions.UpdatePlayerData();
      TriggerEvent(
        "Framework:Server:OnJobUpdate",
        self.PlayerData.source,
        self.PlayerData.job
      );
      TriggerClientEvent(
        "Framework:Client:OnJobUpdate",
        self.PlayerData.source,
        self.PlayerData.job
      );
    }

    return true;
  };

  self.Functions.SetGang = (gang: any, grade: any) => {
    gang = gang.toLowerCase();
    grade = grade.toString() || "0";
    if (!Framework.Shared.Gangs[gang]) {
      return false;
    }
    self.PlayerData.gang.name = gang;
    self.PlayerData.gang.label = Framework.Shared.Gangs[gang].label;
    if (Framework.Shared.Gangs[gang].grades[grade]) {
      const ganggrade = Framework.Shared.Gangs[gang].grades[grade];
      self.PlayerData.gang.grade = {};
      self.PlayerData.gang.grade.name = ganggrade.name;
      self.PlayerData.gang.grade.level = grade.toString();
      self.PlayerData.gang.isboss = ganggrade.isboss || false;
    } else {
      self.PlayerData.gang.grade = {};
      self.PlayerData.gang.grade.name = "No Grades";
      self.PlayerData.gang.grade.level = 0;
      self.PlayerData.gang.isboss = false;
    }

    if (!self.Offline) {
      self.Functions.UpdatePlayerData();
      TriggerEvent(
        "Framework:Server:OnGangUpdate",
        self.PlayerData.source,
        self.PlayerData.gang
      );
      TriggerClientEvent(
        "Framework:Client:OnGangUpdate",
        self.PlayerData.source,
        self.PlayerData.gang
      );
    }

    return true;
  };

  self.Functions.Notify = (text: any, type: any, length: any) => {
    TriggerClientEvent(
      "Framework:Notify",
      self.PlayerData.source,
      text,
      type,
      length
    );
  };
  self.Functions.AddItem = async (pItem: any, pAmount: any, slot: any, pMetaData: any) => {
    const p = new Promise((resolve) => {
      exports["inventory"].AddItem((added: any) => {
        self.Functions.UpdatePlayerData();
        resolve(added);
      }, self.PlayerData.source, pItem, pAmount, pMetaData);
    });

    return await p;
  };
  self.Functions.SetInventory = (pItems: any) => {
    if (GetResourceState('inventory') !== 'missing') {
      self.PlayerData.items = pItems;
      exports["inventory"].updateInventory(self.PlayerData.citizenid, pItems);
      self.Functions.UpdatePlayerData();
    }
  };
  self.Functions.RemoveItem = async (item: any, amount: any) => {
    return new Promise((resolve) => {
      exports["inventory"].RemoveItem((removed: any) => {
        self.Functions.UpdatePlayerData();
        resolve(removed);
      }, self.PlayerData.source, item, amount);
    });
  };
  self.Functions.HasItem = (items: any, amount: any) => {
    return Framework.Functions.Framework.Functions.HasItem(self.PlayerData.source, items, amount);
  };

  self.Functions.SetJobDuty = (onDuty: any) => {
    self.PlayerData.job.onduty = !!onDuty;
    TriggerEvent(
      "Framework:Server:OnJobUpdate",
      self.PlayerData.source,
      self.PlayerData.job
    );
    TriggerClientEvent(
      "Framework:Client:OnJobUpdate",
      self.PlayerData.source,
      self.PlayerData.job
    );
    self.Functions.UpdatePlayerData();
  };

  self.Functions.SetPlayerData = (key: any, val: any) => {
    if (!key || typeof key !== "string") return;
    self.PlayerData[key] = val;
    self.Functions.UpdatePlayerData();
  };
  self.Functions.SetMetaData = (key: any, val: any) => {
    if (!key || typeof key !== "string") return;
    if (key === 'hunger' || key === 'thirst') {
      val = val > 100 ? 100 : val;
    }
    self.PlayerData.metadata[key] = val;
    self.Functions.UpdatePlayerData();
  };

  self.Functions.GetPlayerData = () => {
    return self.PlayerData;
  };

  self.Functions.GetMetaData = (meta: any) => {
    if (!meta || typeof meta !== "string") return;
    return self.PlayerData.metadata[meta];
  };

  self.Functions.AddJobReputation = (amount: any) => {
    if (!amount) return;
    const amountt = amount;
    self.PlayerData.metadata["jobrep"][self.PlayerData.job.name] =
      self.PlayerData.metadata["jobrep"][self.PlayerData.job.name] +
      amountt;
    self.Functions.UpdatePlayerData();
  };

  self.Functions.AddMoney = (moneyType: any, amount: any, reason: any) => {
    if (amount < 0) return;
    moneyType = moneyType.toLowerCase();
    if (!self.PlayerData.money[moneyType]) return;
    self.PlayerData.money[moneyType] += amount;
    if (!self.Offline) {
      self.Functions.UpdatePlayerData();
      if (amount > 100000) {
        TriggerEvent(
          "qb-log:server:CreateLog",
          "playermoney",
          "AddMoney",
          "lightgreen",
          `**${GetPlayerName(self.PlayerData.source)} (citizenid: ${self.PlayerData.citizenid
          } | id: ${self.PlayerData.source
          })** $${amount} (${moneyType}) added, new ${moneyType} balance: ${self.PlayerData.money[moneyType]
          } reason: ${reason}`,
          true
        );
      } else {
        TriggerEvent(
          "qb-log:server:CreateLog",
          "playermoney",
          "AddMoney",
          "lightgreen",
          `**${GetPlayerName(self.PlayerData.source)} (citizenid: ${self.PlayerData.citizenid
          } | id: ${self.PlayerData.source
          })** $${amount} (${moneyType}) added, new ${moneyType} balance: ${self.PlayerData.money[moneyType]
          } reason: ${reason}`
        );
      }
      TriggerClientEvent(
        "hud:client:OnMoneyChange",
        self.PlayerData.source,
        moneyType,
        amount,
        false
      );
      TriggerClientEvent(
        "Framework:Client:OnMoneyChange",
        self.PlayerData.source,
        moneyType,
        amount,
        "add",
        reason
      );
      TriggerEvent(
        "Framework:Server:OnMoneyChange",
        self.PlayerData.source,
        moneyType,
        amount,
        "add",
        reason
      );
    }
  };

  self.Functions.RemoveMoney = (moneyType: any, amount: any, reason: any) => {
    if (amount < 0) return;
    moneyType = moneyType.toLowerCase();
    if (!self.PlayerData.money[moneyType]) return;
    const dontAllowMinus = Framework.Config.Money.DontAllowMinus;
    if (
      dontAllowMinus.includes(moneyType) &&
      self.PlayerData.money[moneyType] - amount < 0
    ) {
      return;
    }
    self.PlayerData.money[moneyType] -= amount;
    if (!self.Offline) {
      self.Functions.UpdatePlayerData();
      if (amount > 100000) {
        TriggerEvent(
          "qb-log:server:CreateLog",
          "playermoney",
          "RemoveMoney",
          "red",
          `**${GetPlayerName(self.PlayerData.source)} (citizenid: ${self.PlayerData.citizenid
          } | id: ${self.PlayerData.source
          })** $${amount} (${moneyType}) removed, new ${moneyType} balance: ${self.PlayerData.money[moneyType]
          } reason: ${reason}`,
          true
        );
      } else {
        TriggerEvent(
          "qb-log:server:CreateLog",
          "playermoney",
          "RemoveMoney",
          "red",
          `**${GetPlayerName(self.PlayerData.source)} (citizenid: ${self.PlayerData.citizenid
          } | id: ${self.PlayerData.source
          })** $${amount} (${moneyType}) removed, new ${moneyType} balance: ${self.PlayerData.money[moneyType]
          } reason: ${reason}`
        );
      }
      TriggerClientEvent(
        "hud:client:OnMoneyChange",
        self.PlayerData.source,
        moneyType,
        amount,
        true
      );
      if (moneyType === "bank") {
        TriggerClientEvent(
          "qb-phone:client:RemoveBankMoney",
          self.PlayerData.source,
          amount
        );
      }
      TriggerClientEvent(
        "Framework:Client:OnMoneyChange",
        self.PlayerData.source,
        moneyType,
        amount,
        "remove",
        reason
      );
      TriggerEvent(
        "Framework:Server:OnMoneyChange",
        self.PlayerData.source,
        moneyType,
        amount,
        "remove",
        reason
      );
    }
  };

  self.Functions.SetMoney = (moneyType: any, amount: any, reason: any) => {
    if (amount < 0) return;
    moneyType = moneyType.toLowerCase();
    if (!self.PlayerData.money[moneyType]) return;
    self.PlayerData.money[moneyType] = amount;
    if (!self.Offline) {
      self.Functions.UpdatePlayerData();
      if (amount > 100000) {
        TriggerEvent(
          "qb-log:server:CreateLog",
          "playermoney",
          "SetMoney",
          "green",
          `**${GetPlayerName(self.PlayerData.source)} (citizenid: ${self.PlayerData.citizenid
          } | id: ${self.PlayerData.source
          })** $${amount} (${moneyType}) set, new ${moneyType} balance: ${self.PlayerData.money[moneyType]
          } reason: ${reason}`,
          true
        );
      } else {
        TriggerEvent(
          "qb-log:server:CreateLog",
          "playermoney",
          "SetMoney",
          "green",
          `**${GetPlayerName(self.PlayerData.source)} (citizenid: ${self.PlayerData.citizenid
          } | id: ${self.PlayerData.source
          })** $${amount} (${moneyType}) set, new ${moneyType} balance: ${self.PlayerData.money[moneyType]
          } reason: ${reason}`
        );
      }
      TriggerClientEvent(
        "hud:client:OnMoneyChange",
        self.PlayerData.source,
        moneyType,
        Math.abs(amount),
        amount < 0
      );
      TriggerClientEvent(
        "Framework:Client:OnMoneyChange",
        self.PlayerData.source,
        moneyType,
        amount,
        "set",
        reason
      );
      TriggerEvent(
        "Framework:Server:OnMoneyChange",
        self.PlayerData.source,
        moneyType,
        amount,
        "set",
        reason
      );
    }
  };

  self.Functions.GetMoney = (moneyType: any) => {
    if (!moneyType) return null;
    moneyType = moneyType.toLowerCase();
    return self.PlayerData.money[moneyType] || null;
  };

  self.Functions.SetCreditCard = (cardNumber: any) => {
    self.PlayerData.charinfo.card = cardNumber;
    self.Functions.UpdatePlayerData();
  };

  self.Functions.GetCardSlot = (cardNumber: any, cardType: any) => {
    const itemType = cardType.toLowerCase();
    const slots: number[] = global.exports["qb-inventory"].GetSlotsByItem(
      self.PlayerData.items,
      itemType
    );

    for (const slot of slots) {
      const item = self.PlayerData.items[slot];
      if (item && item.info.cardNumber === cardNumber) {
        return slot;
      }
    }
    return null;
  };

  self.Functions.Save = () => {
    if (self.Offline) {
      Framework.Player.SaveOffline(self.PlayerData);
    } else {
      Framework.Player.Save(self.PlayerData.source);
    }
  };

  self.Functions.LogOut = () => {
    if (self.Offline) return;
    Framework.Player.Logout(self.PlayerData.source);
  };

  self.Functions.AddMethod = (methodName: string, handler: (...args: any[]) => any) => {
    self.Functions[methodName] = handler;
  };

  self.Functions.AddField = (fieldName: any, data: any) => {
    self[fieldName] = data;
  };
  if (self.Offline) {
    return self;
  } else {
    Framework.Players[self.PlayerData.source] = self;
    TriggerEvent("Framework:Server:PlayerLoaded", self);
    self.Functions.UpdatePlayerData();
    Framework.Player.Save(self.PlayerData.source);
  }
}
let firstRun: boolean = true;
Framework.Player.Save = async (source: any) => {
  const ped = GetPlayerPed(source);
  const pddsa = GetEntityCoords(ped);
  if (firstRun) {
    firstRun = false;
    console.log(firstRun)
    return;
  }

  let pcoords = { x: pddsa[0], y: pddsa[1], z: pddsa[2] };
  const playerData = Framework.Players[source].PlayerData;

  if (playerData) {
    try {
      await MySQL.insert(
        'INSERT INTO players (citizenid, cid, license, name, money, charinfo, job, gang, position, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE cid = ?, name = ?, money = ?, charinfo = ?, job = ?, gang = ?, position = ?, metadata = ?',
        [
          playerData.citizenid,
          playerData.cid,
          playerData.license,
          playerData.name,
          JSON.stringify(playerData.money),
          JSON.stringify(playerData.charinfo),
          JSON.stringify(playerData.job),
          JSON.stringify(playerData.gang),
          JSON.stringify(pcoords),
          JSON.stringify(playerData.metadata),
          playerData.cid,
          playerData.name,
          JSON.stringify(playerData.money),
          JSON.stringify(playerData.charinfo),
          JSON.stringify(playerData.job),
          JSON.stringify(playerData.gang),
          JSON.stringify(pcoords),
          JSON.stringify(playerData.metadata)
        ]
      );
      exports['inventory'].SavePersonalInventory(playerData.citizenid)
      console.log(`[${GetCurrentResourceName()}] Saved player data for ${playerData.name} (${playerData.citizenid})`);
    } catch (error) {
      console.error('ERROR Framework.PLAYER.SAVE - PLAYERDATA IS EMPTY!', error);
    }
  } else {
    console.error('ERROR Framework.PLAYER.SAVE - PLAYERDATA IS EMPTY!');
  }
};
Framework.Player.SaveOffline = async (playerData: any) => {
  if (playerData) {
    try {
      await MySQL.insert(
        'INSERT INTO players (citizenid, cid, license, name, money, charinfo, job, gang, position, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE cid = ?, name = ?, money = ?, charinfo = ?, job = ?, gang = ?, position = ?, metadata = ?',
        [
          playerData.citizenid,
          playerData.cid,
          playerData.license,
          playerData.name,
          JSON.stringify(playerData.money),
          JSON.stringify(playerData.charinfo),
          JSON.stringify(playerData.job),
          JSON.stringify(playerData.gang),
          JSON.stringify(playerData.position),
          JSON.stringify(playerData.metadata),
          // For the ON DUPLICATE KEY UPDATE part
          playerData.cid,
          playerData.name,
          JSON.stringify(playerData.money),
          JSON.stringify(playerData.charinfo),
          JSON.stringify(playerData.job),
          JSON.stringify(playerData.gang),
          JSON.stringify(playerData.position),
          JSON.stringify(playerData.metadata),
        ]
      );

      // Assuming there's a method to save inventory for offline players
      if (GetResourceState('qb-inventory') !== 'missing') {
        global.exports['qb-inventory'].SaveInventory(playerData);
      }
    } catch (error) {
      console.error('ERROR Framework.PLAYER.SAVEOFFLINE - PLAYERDATA IS EMPTY!', error);
    }
  } else {
    console.error('ERROR Framework.PLAYER.SAVEOFFLINE - PLAYERDATA IS EMPTY!');
  }
};
const playertables = [
  { table: "players" },
  { table: "apartments" },
  { table: "bank_accounts" },
  { table: "crypto_transactions" },
  { table: "phone_invoices" },
  { table: "phone_messages" },
  { table: "playerskins" },
  { table: "player_contacts" },
  { table: "player_houses" },
  { table: "player_mails" },
  { table: "player_outfits" },
  { table: "player_vehicles" },
];
Framework.Player.DeleteCharacter = async (source: any, citizenid: any) => {
  const license = Framework.Functions.GetIdentifier(source, 'license');
  const result = await MySQL.query('SELECT license FROM players WHERE citizenid = ?', [citizenid]);

  if (result && result.length > 0 && license === result[0]?.license) {
    try {
      for (const { table } of playertables) {
        await MySQL.query(`DELETE FROM ${table} WHERE citizenid = ?`, [citizenid]);
      }

      // Log character deletion
      TriggerEvent(
        "qb-log:server:CreateLog",
        "joinleave",
        "Character Deleted",
        "red",
        `**${GetPlayerName(source)}** ${license} deleted **${citizenid}**.`
      );
    } catch (error) {
      console.error("Failed to delete character:", error);
      // Handle errors if needed
    }
  } else {
    DropPlayer(
      source,
      "Potential exploit detected: mismatched license during character deletion."
    );
    TriggerEvent(
      "qb-log:server:CreateLog",
      "anticheat",
      "Anti-Cheat",
      "white",
      `${GetPlayerName(
        source
      )} Has Been Dropped For Character Deletion Exploit`,
      true
    );
  }
}

Framework.Player.ForceDeleteCharacter = async (citizenid: any) => {
  const result = await MySQL.query('SELECT license FROM players WHERE citizenid = ?', [citizenid]);

  if (result && result.length > 0) {
    try {
      for (const { table } of playertables) {
        await MySQL.query(`DELETE FROM ${table} WHERE citizenid = ?`, [citizenid]);
      }

      // Log character force deletion
      TriggerEvent(
        "qb-log:server:CreateLog",
        "joinleave",
        "Character Force Deleted",
        "red",
        `Character **${citizenid}** got deleted`
      );
    } catch (error) {
      console.error("Failed to force delete character:", error);
    }
  }
};

Framework.Player.CreateCitizenId = async () => {
  console.log(1, 'triggered');
  let uniqueFound = false;
  let citizenId = (randomStr(3) + randomInt(10000, 99999)).toUpperCase();

  if (!uniqueFound) {
    const result = await MySQL.query("SELECT COUNT(*) as count FROM players WHERE citizenid = ?", [citizenId]);
    if (result && result[0]?.count === 0) {
      uniqueFound = true;
    }
  }
  console.log(2, 'citizenId', citizenId);
  return citizenId;
};

Framework.Player.CreateFingerId = async () => {
  let uniqueFound: any = false;
  let fingerId = "";
  if (!uniqueFound) {
    fingerId = `${randomStr(2)}${randomInt(100, 999)}${randomStr(1)}${randomInt(10, 99)}${randomStr(3)}${randomInt(1000, 9999)}`;

    const result = await MySQL.query("SELECT COUNT(*) AS count FROM `players` WHERE `metadata` LIKE ?", [`${fingerId}`]);

    if (result && result[0].count === 0) {
      uniqueFound = true;
    }
  }
  return fingerId;
};

Framework.Player.CreateWalletId = async () => {
  let uniqueFound = false;
  let walletId = "";
  if (!uniqueFound) {
    walletId = `KSVEC_${randomInt(11111111, 99999999)}`;

    const result = await MySQL.query("SELECT COUNT(*) AS count FROM players WHERE metadata LIKE ?", [`${walletId}`]);

    if (result && result[0]?.count === 0) {
      uniqueFound = true;
    }
  }

  return walletId;
};

Framework.Player.CreateSerialNumber = async () => {
  let uniqueFound = false;
  let serialNumber = "";
  if (!uniqueFound) {
    serialNumber = randomInt(11111111, 99999999).toString();
    const result = await MySQL.query("SELECT COUNT(*) AS count FROM players WHERE metadata LIKE ?", [`${serialNumber}`]);
    if (result && result[0].count === 0) {
      uniqueFound = true;
    }
  }

  return serialNumber;
};
// Evenets Sections
on('chatMessage', (source: number, author: string, message: string) => {
  if (message.startsWith('/')) {
    CancelEvent();
  }
});

on('playerDropped', (reason: string) => {
  const src = global.source; // `source` is a reserved global in FiveM's runtime for the event's source
  if (!Framework.Players[src]) return;

  const player = Framework.Players[src];
  emit('qb-log:server:CreateLog', 'joinleave', 'Dropped', 'red', `**${GetPlayerName(src.toString())}** (${player?.PlayerData?.license}) left..\n **Reason:** ${reason}`);

  player.Functions.Save();

  // Cleaning up after player drop
  delete Framework.Player_Buckets[player.PlayerData.license];
  delete Framework.Players[src]
});

on('playerConnecting', async (name: string, setKickReason: (reason: string) => void, deferrals: any) => {
  const src = global.source;
  deferrals.defer();

  if (Framework.Config.Server.Closed && !IsPlayerAceAllowed(src.toString(), 'qbadmin.join')) {
    return deferrals.done(Framework.Config.Server.ClosedReason);
  }

  if (Framework.Config.Server.Whitelist) {
    setTick(() => {
      deferrals.update("Checking Whitelist", name);
      if (!Framework.Functions.IsWhitelisted(src)) {
        return deferrals.done("Not Whitelisted");
      }
    });
  }


  deferrals.update(`Hello ${name}. Your license is being checked`);
  const license = Framework.Functions.GetIdentifier(src, 'license');
  if (!license) {
    deferrals.done("Not Valid License");
  } else if (Framework.Config.Server.CheckDuplicateLicense && Framework.Functions.IsLicenseInUse(license)) {
    deferrals.done("License In Use");
  } else {
    deferrals.update("Checking Banned Players");

    // let success, isBanned, reason;
    // try {
    //   [success, isBanned, reason] = Framework.Functions.IsPlayerBanned(src);
    // } catch (error) {
    //   return deferrals.done("Database Error");
    // }
    // if (isBanned) {
    //   return deferrals.done(reason);
    // }


    deferrals.update("Joining Server");
    deferrals.done();

    TriggerClientEvent('Framework:Client:SharedUpdate', src, Framework.Shared);
  }



});

onNet('Framework:Server:CloseServer', (reason: string) => {
  const src: number = global.source;
  if (Framework.Functions.HasPermission(src, 'admin')) {
    reason = reason || 'No reason specified'; // Default reason if none is provided
    Framework.Config.Server.Closed = true;
    Framework.Config.Server.ClosedReason = reason;

    Object.keys(Framework.Players).forEach((playerId: string) => {
      const player = Framework.Players[playerId];
      if (player && !Framework.Functions.HasPermission(parseInt(playerId), Framework.Config.Server.WhitelistPermission)) {
        Framework.Functions.Kick(parseInt(playerId), reason);
      }
    });
  } else {
    Framework.Functions.Kick(src, 'You do not have permission to perform this action.');
  }
});

onNet('Framework:Server:OpenServer', () => {
  const src: number = global.source;
  if (Framework.Functions.HasPermission(src, 'admin')) {
    Framework.Config.Server.Closed = false;
    // Optionally, you might want to broadcast a message to all players that the server is now open.
    emit('chat:addMessage', {
      color: [0, 255, 0],
      args: ["Server", "The server is now open to all players."]
    });
  } else {
    Framework.Functions.Kick(src, 'You do not have permission to perform this action.');
  }
});

onNet('Framework:Server:TriggerClientCallback', (name: string, ...args: any[]) => {
  if (Framework.ClientCallbacks && Framework.ClientCallbacks[name]) {
    // Call the callback function with the provided arguments
    Framework.ClientCallbacks[name](...args);

    // Optionally clear the callback after execution if it should only be used once
    delete Framework.ClientCallbacks[name];
  }
});

onNet('Framework:Server:TriggerCallback', (name: string, ...args: any[]) => {
  const src: number = global.source;
  Framework.Functions.TriggerCallback(name, src, (...responseArgs: any[]) => {
    // Trigger a client event with the callback response
    emitNet('Framework:Client:TriggerCallback', src, name, ...responseArgs);
  }, ...args);
});

onNet('Framework:UpdatePlayer', () => {
  const src: number = global.source;
  const player = Framework.Functions.GetPlayer(src);

  if (!player) return;

  let newHunger = player.PlayerData.metadata['hunger'] - Framework.Config.Player.HungerRate;
  let newThirst = player.PlayerData.metadata['thirst'] - Framework.Config.Player.ThirstRate;

  // Ensure hunger and thirst values do not go below 0
  newHunger = Math.max(newHunger, 0);
  newThirst = Math.max(newThirst, 0);

  // Update player metadata for hunger and thirst
  player.Functions.SetMetaData('hunger', newHunger);
  player.Functions.SetMetaData('thirst', newThirst);

  // Inform the client of the updated needs
  emit('hud:client:UpdateNeeds', src, newHunger, newThirst);

  // Save player data
  player.Functions.Save();
});

onNet('Framework:ToggleDuty', () => {
  const src: number = global.source;
  const player = Framework.Functions.GetPlayer(src);

  if (!player) return;

  if (player.PlayerData.job.onduty) {
    player.Functions.SetJobDuty(false);
    emitNet('Framework:Notify', src, 'You are now off duty');
  } else {
    player.Functions.SetJobDuty(true);
    emitNet('Framework:Notify', src, 'You are now on duty');
  }

  // Inform the server and client about the duty status change
  emit('Framework:Server:SetDuty', src, player.PlayerData.job.onduty);
  emitNet('Framework:Client:SetDuty', src, player.PlayerData.job.onduty);
});

onNet('baseevents:enteringVehicle', (veh: number, seat: number, modelName: string) => {
  const src: number = global.source;
  const data = {
    vehicle: veh,
    seat: seat,
    name: modelName,
    event: 'Entering'
  };
  emitNet('Framework:Client:VehicleInfo', src, data);
});

onNet('baseevents:enteredVehicle', (veh: number, seat: number, modelName: string) => {
  const src: number = global.source;
  const data = {
    vehicle: veh,
    seat: seat,
    name: modelName,
    event: 'Entered'
  };
  emitNet('Framework:Client:VehicleInfo', src, data);
});

onNet('baseevents:enteringAborted', () => {
  const src: number = global.source;
  emitNet('Framework:Client:AbortVehicleEntering', src);
});

onNet('baseevents:leftVehicle', (veh: number, seat: number, modelName: string) => {
  const src: number = global.source;
  const data = {
    vehicle: veh,
    seat: seat,
    name: modelName,
    event: 'Left'
  };
  emitNet('Framework:Client:VehicleInfo', src, data);
});

onNet('Framework:CallCommand', (command: string, args: string[]) => {
  const src: number = global.source;
  const commandInfo = Framework.Commands.List[command];

  if (!commandInfo) return;

  const player = Framework.Functions.GetPlayer(src);
  if (!player) return;

  const hasPerm = Framework.Functions.HasPermission(src, `command.${commandInfo.name}`);
  if (hasPerm) {
    if (commandInfo.argsrequired && commandInfo.arguments.length !== 0 && !args[commandInfo.arguments.length - 1]) {
      emitNet('Framework:Notify', src, 'Missing required arguments.', 'error'); // Using placeholder text, replace with Lang:t if available.
    } else {
      commandInfo.callback(src, args);
    }
  } else {
    emitNet('Framework:Notify', src, 'You do not have access to this command.', 'error'); // Using placeholder text, replace with Lang:t if available.
  }
});

function tPrint(obj: any, indent: number = 0): void {
  if (typeof obj === 'object') {
    if (obj === null || undefined) return;
    for (const [key, value] of Object.entries(obj)) {
      const valueType = typeof value;
      const formatting = `${' '.repeat(indent * 2)}${key}:`;

      if (valueType === 'object') {
        console.log(formatting);
        tPrint(value, indent + 1);
      } else if (valueType === 'boolean') {
        console.log(`${formatting} ${value}`);
      } else if (valueType === 'function') {
        console.log(`${formatting} ${value}`);
      } else if (valueType === 'number') {
        console.log(`${formatting} ${value}`);
      } else if (valueType === 'string') {
        console.log(`${formatting} '${value}'`);
      } else {
        console.log(`${formatting} ${value}`);
      }
    }
  } else {
    console.log(`${' '.repeat(indent * 2)}${obj}`);
  }
}

onNet('Framework:DebugSomething', (obj: any, indent: number = 0, resource: string) => {
  console.log(`\x1b[4m\x1b[36m[ ${resource} : DEBUG]\x1b[0m`);
  tPrint(obj, indent);
  console.log(`\x1b[4m\x1b[36m[ END DEBUG ]\x1b[0m`);
});
global.exports("GetCoreObject", () => Framework);
// function paycheckInterval() {
//   if (Object.keys(Framework.Players).length > 0) {
//     for (const src of Object.keys(Framework.Players)) {
//       const player = Framework.Players[src];
//       if (player) {
//         const jobName = player.PlayerData.job.name;
//         const jobGrade = player.PlayerData.job.grade.level.toString();
//         const payment = QBShared.Jobs[jobName]?.grades[jobGrade]?.payment || player.PlayerData.job.payment;
//         const onDuty = player.PlayerData.job.onduty;
//         const offDutyPay = QBShared.Jobs[jobName]?.offDutyPay;

//         if (payment > 0 && (offDutyPay || onDuty)) {
//           if (Framework.Config.Money.PayCheckSociety) {
//             const account = global.exports['qb-banking'].GetAccountBalance(jobName)
//             if (account !== 0) {
//               if (account < payment) {
//                 TriggerClientEvent('Framework:Notify', player.PlayerData.source, 'Your company does not have enough money to pay you.', 'error');
//               } else {
//                 player.Functions.AddMoney('bank', payment, 'paycheck');
//                 global.exports['qb-banking'].RemoveMoney(jobName, payment, 'Employee Paycheck');
//                 TriggerClientEvent('Framework:Notify', player.PlayerData.source, `You received your paycheck: $${payment}`);
//               }
//             } else {
//               player.Functions.AddMoney('bank', payment, 'paycheck');
//               TriggerClientEvent('Framework:Notify', player.PlayerData.source, `You received your paycheck: $${payment}`);
//             }
//           } else {
//             player.Functions.AddMoney('bank', payment, 'paycheck');
//             TriggerClientEvent('Framework:Notify', player.PlayerData.source, `You received your paycheck: $${payment}`);
//           }
//         }
//       }
//     }
//   }

//   setTimeout(paycheckInterval, Framework.Config.Money.PayCheckTimeOut * 60000); // Converted to milliseconds
// }

// // Initial call to start the interval
// paycheckInterval();

