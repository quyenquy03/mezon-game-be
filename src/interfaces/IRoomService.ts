import { CreateRoomSubmitDTO } from "@/models/rooms/ICreateRoomSubmitDTO";
import { IJoinRoomSubmitDTO } from "@/models/rooms/IJoinRoomSubmitDTO";

export interface IRoomService {
  createRoomAsync(room: CreateRoomSubmitDTO): Promise<ServiceResponse>;
  getListRooms(): Promise<ServiceResponse>;
  removeRoom(roomId: string): Promise<ServiceResponse>;
  getRoomById(roomId: string): Promise<ServiceResponse>;
  checkRoomBeforeJoin(room: IJoinRoomSubmitDTO): Promise<ServiceResponse>;
  joinRoom(room: IJoinRoomSubmitDTO): Promise<ServiceResponse>;
  leaveRoom(room: IJoinRoomSubmitDTO): Promise<ServiceResponse>;
  getMemberOfRoom(roomId: string): Promise<ServiceResponse>;
}
