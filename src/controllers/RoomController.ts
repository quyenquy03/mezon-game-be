import { IRoomService } from "@/interfaces/IRoomService";
import { validationMiddleware } from "@/middlewares";
import { CreateRoomSubmitDTO } from "@/models/rooms/ICreateRoomSubmitDTO";
import { before, GET, POST, route } from "awilix-express";
import { Request, Response } from "express";
// DOT NOT REMOVE COMMENTS WHICH START WITH /** @swagger AND END WITH */
// IT'S USED TO GENERATE SWAGGER DOCUMENTS
/**
 * @swagger
 * "tags": {
 *   "name": "Game",
 *   "description": "API for Game"
 * }
 */
@route("/rooms")
export class RoomController {
  private _roomService: IRoomService;
  constructor(RoomService: IRoomService) {
    this._roomService = RoomService;
  }
  @POST()
  // @before(validationMiddleware(CreateRoomSubmitDTO))
  @route("/create-room")
  public async createNewRoom(req: Request, res: Response) {
    const response = await this._roomService.createRoomAsync(req.body);
    return res.status(response.statusCode).json(response);
  }
}
