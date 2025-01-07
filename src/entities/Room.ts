import { v4 as uuid } from "uuid";

class RoomInfo {
  public roomId: string;
  public roomName: string;
  public roomMaxUser: number;
  public roomRound: number;
  public roomBet: number;
  public roomPassword: string;
  public roomUsePassword: boolean;
}

class Room {
  public roomId = uuid();
  public roomInfo: RoomInfo;
  public roomMembers: string[] = [];
  public isPlaying = false;
}

export { Room, RoomInfo };
