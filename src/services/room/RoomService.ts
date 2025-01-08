import { Room, RoomInfo } from "@/entities/Room";
import logger from "@/helpers/logger";
import { IRoomService } from "@/interfaces/IRoomService";
import { IUserService } from "@/interfaces/IUserService";
import { CreateRoomSubmitDTO } from "@/models/rooms/ICreateRoomSubmitDTO";
import { IJoinRoomSubmitDTO } from "@/models/rooms/IJoinRoomSubmitDTO";
import { generateId } from "@/utils/generateId";
import UserService from "../user/UserService";

class RoomService implements IRoomService {
  private static instance: RoomService;
  private listRooms: Array<Room> = [];
  private _userService: IUserService;
  private constructor() {
    this._userService = UserService.getInstance();
  }

  public static getInstance(): RoomService {
    if (!RoomService.instance) {
      RoomService.instance = new RoomService();
    }
    return RoomService.instance;
  }

  public async getListRooms(): Promise<ServiceResponse> {
    // Implementation here
    try {
      return {
        statusCode: 200,
        isSuccess: true,
        data: this.listRooms,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Lỗi từ hệ thống",
      };
    }
  }

  public async removeRoom(roomId: string): Promise<ServiceResponse> {
    // Implementation here
    try {
      if (!roomId) {
        return {
          statusCode: 400,
          isSuccess: false,
          errorMessage: "Không tìm thấy mã phòng",
        };
      }
      const roomIndex = this.listRooms.findIndex((room) => room.roomId === roomId);
      if (roomIndex === -1) {
        return {
          statusCode: 404,
          isSuccess: false,
          errorMessage: "Không tìm thấy phòng",
        };
      }
      this.listRooms.splice(roomIndex, 1);
      return {
        statusCode: 200,
        isSuccess: true,
        data: roomId,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Lỗi từ hệ thống",
      };
    }
  }

  private getRoomInfo(roomId: string): RoomInfo {
    const room = this.listRooms.find((room) => room.roomId === roomId);
    return room.roomInfo;
  }
  public async getRoomById(roomId: string): Promise<ServiceResponse> {
    // Implementation here
    try {
      const room = this.listRooms.find((room) => room.roomId === roomId);
      if (!room) {
        return {
          statusCode: 404,
          isSuccess: false,
          errorMessage: "Không tìm thấy phòng",
        };
      }
      return {
        statusCode: 200,
        isSuccess: true,
        data: room,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Lỗi từ hệ thống",
      };
    }
  }

  public async checkRoomBeforeJoin(data: IJoinRoomSubmitDTO): Promise<ServiceResponse> {
    if (!data.roomId || !data.userId) {
      return {
        statusCode: 400,
        isSuccess: false,
        errorMessage: "Vui lòng kiểm tra lại thông tin",
      };
    }
    const room = this.listRooms.find((room) => room.roomId === data.roomId);
    const checkUserInRoom = room?.roomMembers.find((userId) => userId === data.userId);
    if (checkUserInRoom) {
      return {
        statusCode: 200,
        isSuccess: true,
        data: room.roomInfo,
      };
    }
    if (!room) {
      return {
        statusCode: 400,
        isSuccess: false,
        errorMessage: "Không tìm thấy thông tin phòng",
      };
    }
    if (room.roomMembers.length >= room.roomInfo.roomMaxUser) {
      return {
        statusCode: 400,
        isSuccess: false,
        errorMessage: "Phòng đã đủ người chơi",
      };
    }
    const user = await this._userService.getUserById(data.userId);
    if (!user || !user.isSuccess) {
      return user;
    }
    if ((user.data as User).wallet < room.roomInfo.roomBet) {
      return {
        statusCode: 400,
        isSuccess: false,
        errorMessage: "Số dư không đủ để tham gia phòng",
      };
    }
    return {
      statusCode: 200,
      isSuccess: true,
      data: room.roomInfo,
    };
  }

  public async joinRoom(data: IJoinRoomSubmitDTO): Promise<ServiceResponse> {
    try {
      const checkBeforeJoinRoomResponse = await this.checkRoomBeforeJoin(data);
      if (!checkBeforeJoinRoomResponse.isSuccess) {
        return checkBeforeJoinRoomResponse;
      }
      const room = await this.getRoomById(data.roomId);
      if (!room.isSuccess) {
        return room;
      }
      const newRoom = room.data as Room;
      const checkUserInRoom = newRoom.roomMembers.find((userId) => userId === data.userId);
      if (!checkUserInRoom) {
        newRoom.roomMembers.push(data.userId);
      }

      const roomInfo = this.getRoomInfo(data.roomId);
      return {
        statusCode: 200,
        isSuccess: true,
        data: roomInfo,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Internal server error",
      };
    }
  }

  public async leaveRoom(room: IJoinRoomSubmitDTO): Promise<ServiceResponse> {
    try {
      if (!room.roomId || !room.userId) {
        return {
          statusCode: 400,
          isSuccess: false,
          errorMessage: "Vui lòng kiểm tra lại thông tin",
        };
      }
      const currentRoom = await this.getRoomById(room.roomId);
      if (!currentRoom.isSuccess) {
        return currentRoom;
      }
      const newRoom = currentRoom.data as Room;
      const userIndex = newRoom.roomMembers.findIndex((userId) => userId === room.userId);
      if (userIndex === -1) {
        return {
          statusCode: 400,
          isSuccess: false,
          errorMessage: "Người chơi không tồn tại trong phòng",
        };
      }
      newRoom.roomMembers.splice(userIndex, 1);
      return {
        statusCode: 200,
        isSuccess: true,
        data: newRoom,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Internal server error",
      };
    }
  }

  public async getMemberOfRoom(roomId: string): Promise<ServiceResponse> {
    try {
      const room = await this.getRoomById(roomId);
      if (!room.isSuccess) {
        return room;
      }
      const listUsers = this._userService.getListUsers();
      const listMembers = room.data?.roomMembers?.map((userId: string) => {
        const user = listUsers.find((user) => user.id === userId);
        return user;
      });
      return {
        statusCode: 200,
        isSuccess: true,
        data: listMembers,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Internal server error",
      };
    }
  }

  public async createRoomAsync(room: CreateRoomSubmitDTO): Promise<ServiceResponse> {
    // Implementation here
    try {
      if (!room.roomName || !room.roomMaxUser || !room.roomRound || !room.roomBet) {
        return {
          statusCode: 400,
          isSuccess: false,
          errorMessage: "Vui lòng kiểm tra lại thông tin",
        };
      }
      if (room.roomBet < 0) {
        return {
          statusCode: 400,
          isSuccess: false,
          errorMessage: "Số tiền cược không hợp lệ",
        };
      }
      if (room.roomBet > 1000000) {
        return {
          statusCode: 400,
          isSuccess: false,
          errorMessage: "Số tiền cược quá lớn, vui lòng cược ít hơn 1 triệu",
        };
      }

      const newRoom = new Room();
      const roomId = generateId(6, "number");
      newRoom.roomInfo = room;
      newRoom.roomId = roomId;
      newRoom.roomInfo.roomId = roomId;
      this.listRooms.push(newRoom);

      // Implementation here
      return {
        statusCode: 200,
        isSuccess: true,
        message: "Room created successfully",
        data: newRoom,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Internal server error",
      };
    }
  }
}

export default RoomService;
