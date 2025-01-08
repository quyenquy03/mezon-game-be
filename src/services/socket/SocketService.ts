import Application from "@/app";
import { SocketEvents } from "@/constants/SocketEvent";
import ISocketService from "@/interfaces/ISocketService";
import { IUserService } from "@/interfaces/IUserService";
import { Server, Socket } from "socket.io";
import UserService from "../user/UserService";
import { CreateRoomSubmitDTO } from "@/models/rooms/ICreateRoomSubmitDTO";
import { IRoomService } from "@/interfaces/IRoomService";
import RoomService from "../room/RoomService";
import { IJoinRoomSubmitDTO } from "@/models/rooms/IJoinRoomSubmitDTO";
import { IGameService } from "@/interfaces/IGameService";
import GameService from "../game/GameService";
import { IStartRoundSubmitDTO } from "@/models/games/IStartRoundSubmitDTO";
import { RoundGame } from "@/entities/Game";
import { IStartTurnSubmitDTO } from "@/models/games/IStartTurnSubmitDTO";
import { ISubmitTurnDTO } from "@/models/games/ISubmitTurnDTO";
import { IGetTurnResultDTO } from "@/models/games/IGetTurnResultDTO";
import { GAME_TIME } from "@/constants/GameTime";
import { IContinueJoinGameSubmitDTO } from "@/models/games/IContinueJoinGameSubmitDTO";
import { ICombineNextRoundSubmitDTO } from "@/models/games/ICombineRoundSubmitDTO";
import { Room } from "@/entities/Room";
import { IEndGameDTO } from "@/models/games/IEndGameDTO";

class SocketService implements ISocketService {
  private socketServer: Server;
  private _userService: IUserService;
  private _roomService: IRoomService;
  private _gameService: IGameService;
  constructor(Application: Application) {
    this.socketServer = Application.socketServer;
    this._userService = UserService.getInstance();
    this._roomService = RoomService.getInstance();
    this._gameService = GameService.getInstance();
    this.initGameService();
  }

  private initGameService = () => {
    this.socketServer.on("connection", this.onSocketConnect);
    // this.initScheduler();
  };

  private onSocketConnect = (socket: Socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`User ${userId} connected with socket id: ${socket.id}`);
    socket.emit(SocketEvents.EMIT.USER_CONNECTED, { id: socket.id, userId: userId });
    socket.on(SocketEvents.ON.USER_DISCONNECT, () => this.onDisconnect(socket));
    socket.on(SocketEvents.ON.USER_VISIT_GAME, (data: User) => this.onUserVisitGame(socket, data));
    socket.on(SocketEvents.ON.CREATE_ROOM, (data: CreateRoomSubmitDTO) => this.onCreateRoom(socket, data));
    socket.on(SocketEvents.ON.GET_LIST_ROOMS, () => this.onGetListRoom(socket));
    socket.on(SocketEvents.ON.JOIN_ROOM, (data: IJoinRoomSubmitDTO) => this.onJoinRoom(socket, data));
    socket.on(SocketEvents.ON.LEFT_ROOM, (data: IJoinRoomSubmitDTO) => this.onLeaveRoom(socket, data));
    socket.on(SocketEvents.ON.CHECK_ROOM_BEFORE_JOIN, (data: IJoinRoomSubmitDTO) => this.onCheckRoomBeforeJoin(socket, data));
    socket.on(SocketEvents.ON.CHECK_BEFORE_START_GAME, (data: { roomId: string }) => this.onCheckBeforeStartGame(socket, data));
    socket.on(SocketEvents.ON.START_ROUND, (data: IStartRoundSubmitDTO) => this.onStartRound(socket, data));
    socket.on(SocketEvents.ON.START_TURN, (data: IStartTurnSubmitDTO) => this.onStartTurn(socket, data));
    socket.on(SocketEvents.ON.SUBMIT_TURN, (data: ISubmitTurnDTO) => this.onSubmitTurn(socket, data));
    socket.on(SocketEvents.ON.GET_TURN_RESULT, (data: IGetTurnResultDTO) => this.onGetTurnResult(socket, data));
    socket.on(SocketEvents.ON.CONTINUE_JOIN_GAME, (data: IContinueJoinGameSubmitDTO) => this.onContinueJoinGame(socket, data));
    socket.on(SocketEvents.ON.COMBINE_NEXT_ROUND, (data: ICombineNextRoundSubmitDTO) => this.onCombineNextRound(socket, data));
    // socket.on(SocketEvents.ON.GET_MEMBER_OF_ROOM, (data) => this.onGetMemberOfRoom(socket, data));
  };

  onUserVisitGame = async (socket: Socket, user: User) => {
    user.socketId = socket.id;
    const addUserResponse = await this._userService.addUser(user);
    if (addUserResponse.isSuccess) {
      console.log(`User ${user.id} visited game`);
      socket.emit(SocketEvents.EMIT.USER_VISIT_GAME_SUCCESS, user);
    } else {
      console.log(`User ${user.id} visit game failed: ${addUserResponse.errorMessage}`);
      socket.emit(SocketEvents.EMIT.USER_VISIT_GAME_FAILED, addUserResponse);
    }
  };

  onCreateRoom = async (socket: Socket, data: CreateRoomSubmitDTO) => {
    const createRoomResponse = await this._roomService.createRoomAsync(data);
    if (createRoomResponse.isSuccess) {
      console.log(`User with socket id ${socket.id} created room ${createRoomResponse.data.roomId} successfully`);
      const getListRoomResponse = await this._roomService.getListRooms();
      socket.emit(SocketEvents.EMIT.CREATE_ROOM_SUCCESS, createRoomResponse);
      this.socketServer.emit(SocketEvents.EMIT.GET_LIST_ROOMS_SUCCESS, getListRoomResponse);
    } else {
      console.log(`User with socket id ${socket.id} created room failed: ${createRoomResponse.errorMessage}`);
      socket.emit(SocketEvents.EMIT.CREATE_ROOM_FAILED, createRoomResponse);
    }
  };

  onGetListRoom = async (socket: Socket) => {
    const getListRoomResponse = await this._roomService.getListRooms();
    if (getListRoomResponse.isSuccess) {
      console.log(`User with socket id ${socket.id} get list room successfully`);
      socket.emit(SocketEvents.EMIT.GET_LIST_ROOMS_SUCCESS, getListRoomResponse);
    } else {
      console.log(`User with socket id ${socket.id} get list room failed: ${getListRoomResponse.errorMessage}`);
      socket.emit(SocketEvents.EMIT.GET_LIST_ROOMS_FAILED, getListRoomResponse);
    }
  };

  onCheckRoomBeforeJoin = async (socket: Socket, data: IJoinRoomSubmitDTO) => {
    const checkRoomBeforeJoinResponse = await this._roomService.checkRoomBeforeJoin(data);
    if (checkRoomBeforeJoinResponse.isSuccess) {
      console.log(`User with socket id ${socket.id} check room ${data.roomId} before join successfully`);
      socket.emit(SocketEvents.EMIT.CHECK_ROOM_BEFORE_JOIN_SUCCESS, checkRoomBeforeJoinResponse);
    } else {
      console.log(
        `User with socket id ${socket.id} check room ${data.roomId} before join failed: ${checkRoomBeforeJoinResponse.errorMessage}`
      );
      socket.emit(SocketEvents.EMIT.CHECK_ROOM_BEFORE_JOIN_FAILED, checkRoomBeforeJoinResponse);
    }
  };

  onJoinRoom = async (socket: Socket, data: IJoinRoomSubmitDTO) => {
    const joinRoomResponse = await this._roomService.joinRoom(data);
    if (joinRoomResponse.isSuccess) {
      console.log(`User with socket id ${socket.id} join room ${data.roomId} successfully`);
      socket.join(data.roomId);
      socket.emit(SocketEvents.EMIT.JOIN_ROOM_SUCCESS, joinRoomResponse);
      const getListRoomResponse = await this._roomService.getMemberOfRoom(data.roomId);
      this.socketServer.to(data.roomId).emit(SocketEvents.EMIT.GET_MEMBER_OF_ROOM_SUCCESS, getListRoomResponse);
    } else {
      console.log(`User with socket id ${socket.id} join room failed: ${joinRoomResponse.errorMessage}`);
      socket.emit(SocketEvents.EMIT.JOIN_ROOM_FAILED, joinRoomResponse);
    }
  };

  onLeaveRoom = async (socket: Socket, data: IJoinRoomSubmitDTO) => {
    const leaveRoomResponse = await this._roomService.leaveRoom(data);
    if (leaveRoomResponse.isSuccess) {
      console.log(`User with socket id ${socket.id} left room ${data.roomId} successfully`);
      socket.leave(data.roomId);
      socket.emit(SocketEvents.EMIT.LEFT_ROOM_SUCCESS, leaveRoomResponse);
      const getListRoomResponse = await this._roomService.getMemberOfRoom(data.roomId);
      this.socketServer.to(data.roomId).emit(SocketEvents.EMIT.GET_MEMBER_OF_ROOM_SUCCESS, getListRoomResponse);
    } else {
      console.log(`User with socket id ${socket.id} left room failed: ${leaveRoomResponse.errorMessage}`);
      socket.emit(SocketEvents.EMIT.LEFT_ROOM_FAILED, leaveRoomResponse);
    }
  };

  onCheckBeforeStartGame = async (socket: Socket, data: { roomId: string }) => {
    console.log(`User with socket id ${socket.id} check before start game`);
    const checkBeforeStartGameResponse = await this._gameService.checkBeforeStartNewGame(data);
    if (!checkBeforeStartGameResponse.isSuccess) {
      console.log(
        `User with socket id ${socket.id} check before start game failed: ${checkBeforeStartGameResponse.errorMessage}`
      );
      socket.emit(SocketEvents.EMIT.CHECK_BEFORE_START_GAME_FAILED, checkBeforeStartGameResponse);
      return;
    }
    const startNewGameResponse = await this._gameService.startNewGame(data);
    if (!startNewGameResponse.isSuccess) {
      console.log(`User with socket id ${socket.id} start new game failed: ${startNewGameResponse.errorMessage}`);
      socket.emit(SocketEvents.EMIT.START_NEW_GAME_FAILED, startNewGameResponse);
      return;
    }
    console.log(`User with socket id ${socket.id} start new game successfully`);
    this.socketServer.to(data.roomId).emit(SocketEvents.EMIT.START_NEW_GAME_SUCCESS, startNewGameResponse);
  };

  onStartRound = async (socket: Socket, data: IStartRoundSubmitDTO) => {
    const getGameByIdResponse = await this._gameService.getGameById(data.gameId);
    if (!getGameByIdResponse.isSuccess) {
      console.log(`User with socket id ${socket.id} get game ${data.gameId} failed: ${getGameByIdResponse.errorMessage}`);
      socket.emit(SocketEvents.EMIT.START_ROUND_FAILED, getGameByIdResponse);
      return;
    }
    if (getGameByIdResponse.data.isEnd) {
      console.log(`User with socket id ${socket.id} start round failed: Game is ended`);
      socket.emit(SocketEvents.EMIT.START_ROUND_FAILED, {
        isSuccess: false,
        errorMessage: "Game is ended",
      });
      return;
    }
    const getRoundOfGameResponse = await this._gameService.getRoundOfGame(data.gameId, data.currentRound);
    if (!getRoundOfGameResponse.isSuccess) {
      console.log(
        `User with socket id ${socket.id} get round ${data.currentRound} of game ${data.gameId} failed: ${getRoundOfGameResponse.errorMessage}`
      );
      socket.emit(SocketEvents.EMIT.START_ROUND_FAILED, getRoundOfGameResponse);
      return;
    }
    const roundGame = getRoundOfGameResponse.data as RoundGame;
    const myGroup = roundGame.playerGroup.find((group) => group.player1 === data.userId || group.player2 === data.userId);
    if (!myGroup) {
      console.log(`User with socket id ${socket.id} start round failed: Bạn đã thua trận đấu`);
      socket.emit(SocketEvents.EMIT.START_ROUND_FAILED, {
        isSuccess: false,
        errorMessage: "Bạn đã thua trận đấu",
      });
    }
    socket.join(roundGame.roundId);
    if (data.currentRound === 1) {
      socket.join(data.gameId);
    }
    const yourInfo = await this._userService.getUserById(data.userId);
    const rivalInfo = await this._userService.getUserById(myGroup?.player1 === data.userId ? myGroup?.player2 : myGroup?.player1);
    const roundInfo = {
      gameId: data.gameId,
      roundId: roundGame.roundId,
      currentRound: roundGame.round,
      currentTurn: roundGame.currentTurn,
      yourInfo: yourInfo.data,
      rivalInfo: rivalInfo.data,
    };
    socket.emit(SocketEvents.EMIT.START_ROUND_SUCCESS, {
      isSuccess: true,
      data: roundInfo,
    });
  };

  onStartTurn = async (socket: Socket, data: IStartTurnSubmitDTO) => {
    const getGameByIdResponse = await this._gameService.getGameById(data.gameId);
    if (!getGameByIdResponse.isSuccess) {
      console.log(`User with socket id ${socket.id} get game ${data.gameId} failed: ${getGameByIdResponse.errorMessage}`);
      socket.emit(SocketEvents.EMIT.START_TURN_FAILED, getGameByIdResponse);
      return;
    }
    socket.emit(SocketEvents.EMIT.START_TURN_SUCCESS, {
      isSuccess: true,
      data,
    });
    setTimeout(() => {
      socket.emit(SocketEvents.EMIT.SUBMIT_TURN_NOW, {
        isSuccess: true,
        data,
      });
    }, GAME_TIME.ONE_TURN_TIME);
  };

  onSubmitTurn = async (socket: Socket, data: ISubmitTurnDTO) => {
    const submitTurnResponse = await this._gameService.submitTurn(data);
    if (!submitTurnResponse.isSuccess) {
      console.log(`User with socket id ${socket.id} submit turn failed: ${submitTurnResponse.errorMessage}`);
      socket.emit(SocketEvents.EMIT.SUBMIT_TURN_FAILED, submitTurnResponse);
      return;
    }
    console.log(`User with socket id ${socket.id} submit turn successfully`);
    this.socketServer.to(data.roundId).emit(SocketEvents.EMIT.SUBMIT_TURN_SUCCESS, submitTurnResponse);
  };

  onGetTurnResult = async (socket: Socket, data: IGetTurnResultDTO) => {
    const getTurnResultResponse = await this._gameService.getTurnResult(data);
    if (!getTurnResultResponse.isSuccess) {
      console.log(`User with socket id ${socket.id} get turn result failed: ${getTurnResultResponse.errorMessage}`);
      socket.emit(SocketEvents.EMIT.GET_TURN_RESULT_FAILED, getTurnResultResponse);
      return;
    }
    const turnResult = getTurnResultResponse.data;
    socket.emit(SocketEvents.EMIT.GET_TURN_RESULT_SUCCESS, {
      isSuccess: true,
      data: {
        turn: data.currentTurn,
        yourChoice: turnResult.player1Id === data.userId ? turnResult.player1Choice : turnResult.player2Choice,
        rivalChoice: turnResult.player1Id === data.userId ? turnResult.player2Choice : turnResult.player1Choice,
        winner: turnResult.winner,
      },
    });

    const roundGame = await this._gameService.getRoundOfGame(data.gameId, data.currentRound);
    setTimeout(() => {
      // end round if current turn greater than total turn of round
      const roundGameData = roundGame.data as RoundGame;
      let winCount = 0;
      let loseCount = 0;
      const myGroup = roundGameData.playerGroup.find((group) => group.player1 === data.userId || group.player2 === data.userId);
      myGroup?.results.forEach((result) => {
        if (result.winner !== null && result.winner === data.userId) {
          winCount++;
        }
        if (result.winner !== null && result.winner !== data.userId) {
          loseCount++;
        }
      });
      if (data.currentTurn >= myGroup?.results.length) {
        if (winCount === loseCount) {
          // start dice turn if current turn greater than total turn + 1;
          if (data.currentTurn >= myGroup?.results.length + 1) {
          }

          // add new turn to start next turn.
          myGroup?.results.push({
            turn: myGroup?.results.length + 1,
            player1Choice: null,
            player2Choice: null,
            winner: null,
          });
          const nextTurnData: IStartTurnSubmitDTO = {
            roomId: data.roomId,
            gameId: data.gameId,
            userId: data.userId,
            currentRound: data.currentRound,
            roundId: data.roundId,
            currentTurn: data.currentTurn + 1,
          };
          socket.emit(SocketEvents.EMIT.CONTINUE_TURN, {
            isSuccess: true,
            data: nextTurnData,
          });
          return;
        }

        // end round
        const endOfRoundData = {
          gameId: data.gameId,
          roundId: data.roundId,
          currentRound: data.currentRound,
          roomId: data.roomId,
          winner: winCount > loseCount ? data.userId : myGroup?.player1 === data.userId ? myGroup?.player2 : myGroup?.player1,
          isWinner: winCount > loseCount,
        };
        socket.emit(SocketEvents.EMIT.END_OF_ROUND, {
          isSuccess: true,
          data: endOfRoundData,
          message: "End Of Round",
        });
        return;
      }

      // continue turn
      const nextTurnData: IStartTurnSubmitDTO = {
        roomId: data.roomId,
        gameId: data.gameId,
        userId: data.userId,
        currentRound: data.currentRound,
        roundId: data.roundId,
        currentTurn: data.currentTurn + 1,
      };
      socket.emit(SocketEvents.EMIT.CONTINUE_TURN, {
        isSuccess: true,
        data: nextTurnData,
      });
    }, GAME_TIME.SHOW_TURN_RESULT_TIME);
  };

  onContinueJoinGame = async (socket: Socket, data: IContinueJoinGameSubmitDTO) => {
    const continueJoinGameResponse = await this._gameService.continueJoinGame(data);
    if (!continueJoinGameResponse.isSuccess) {
      console.log(`User with socket id ${socket.id} continue join game failed: ${continueJoinGameResponse.errorMessage}`);
      socket.emit(SocketEvents.EMIT.CONTINUE_JOIN_GAME_FAILED, continueJoinGameResponse);
      return;
    }
    console.log(`User with socket id ${socket.id} continue join game successfully`);
    const nextRoundData = {
      roomId: data.roomId,
      gameId: data.gameId,
      currentRound: data.currentRound,
      roundId: continueJoinGameResponse.data,
    };
    socket.join(nextRoundData.roundId);
    socket.emit(SocketEvents.EMIT.CONTINUE_JOIN_GAME_SUCCESS, {
      isSuccess: true,
      data: nextRoundData,
      message: "Continue join game successfully",
    });
  };

  onCombineNextRound = async (socket: Socket, data: ICombineNextRoundSubmitDTO) => {
    const currentRoomResponse = await this._roomService.getRoomById(data.roomId);
    if (!currentRoomResponse || !currentRoomResponse.isSuccess) {
      console.log(`User with socket id ${socket.id} combine next round: ${currentRoomResponse.errorMessage}`);
      socket.emit(SocketEvents.EMIT.COMBINE_NEXT_ROUND_FAILED, currentRoomResponse);
      return;
    }
    const currentRoom = currentRoomResponse.data as Room;
    const roundGameResponse = await this._gameService.getRoundOfGame(data.gameId, data.currentRound);
    if (!roundGameResponse || !roundGameResponse.isSuccess) {
      console.log(`User with socket id ${socket.id} combine next round: ${roundGameResponse.errorMessage}`);
      socket.emit(SocketEvents.EMIT.COMBINE_NEXT_ROUND_FAILED, roundGameResponse);
      return;
    }
    const roundGame = roundGameResponse.data as RoundGame;
    if (roundGame.playerOfRound.length === currentRoom.roomInfo?.roomMaxUser / 2 ** (roundGame.round - 1)) {
      if (roundGame.playerOfRound.length === 1) {
        // handle end game.
        const endGameData: IEndGameDTO = {
          gameId: data.gameId,
          roomId: data.roomId,
          winner: data.userId,
        };
        const endGameResponse = await this._gameService.endGame(endGameData);
        if (!endGameResponse.isSuccess) {
          this.socketServer.to(data.gameId).emit(SocketEvents.EMIT.END_OF_GAME, {
            isSuccess: false,
            errorMessage: endGameResponse.errorMessage,
          });
          return;
        }
        this.socketServer.to(data.gameId).emit(SocketEvents.EMIT.END_OF_GAME, {
          isSuccess: true,
          data: {
            gameId: data.gameId,
            roomId: data.roomId,
            winner: data.userId,
            totalBet: (endGameResponse.data as IEndGameDTO).totalBet,
            betOfOneGame: (endGameResponse.data as IEndGameDTO).betOfOneGame,
          },
        });
        return;
      }
      const combineNextRoundResponse = await this._gameService.combineNextRound(data);
      if (!combineNextRoundResponse.isSuccess) {
        console.log(`User with socket id ${socket.id} combine next round failed 349: ${combineNextRoundResponse.errorMessage}`);
        socket.emit(SocketEvents.EMIT.COMBINE_NEXT_ROUND_FAILED, combineNextRoundResponse);
        return;
      }
      const combineRoundData = {
        roomId: data.roomId,
        gameId: data.gameId,
        currentRound: data.currentRound,
        roundId: combineNextRoundResponse.data,
      };
      this.socketServer.to(data.roundId).emit(SocketEvents.EMIT.COMBINE_NEXT_ROUND_SUCCESS, {
        isSuccess: true,
        data: combineRoundData,
      });
    }
  };

  onDisconnect = (socket: Socket) => {
    console.log(`User ${socket.id} disconnected`);
  };
}
export default SocketService;
