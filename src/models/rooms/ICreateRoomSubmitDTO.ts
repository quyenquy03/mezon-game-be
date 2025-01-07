import { Expose } from "class-transformer";
// DOT NOT REMOVE COMMENTS WHICH START WITH /** @swagger AND END WITH */
// IT'S USED TO GENERATE SWAGGER DOCUMENTS

/**
 * @swagger
 * "components": {
 *  "schemas": {
 *     "CreateRoomSubmitDTO {": {
 *     "type": "object",
 *     "properties": {
 *       "id": {
 *         "type": "string"
 *       },
 *       "roomName": {
 *         "type": "string"
 *       },
 *      "roomMaxUser": {
 *         "type": "number"
 *      },
 *      "roomRound": {
 *         "type": "array",
 *        "items": {
 *         "type": "string"
 *       }
 *     },
 *      "roomBet": {
 *          "type": "string",
 *          "format": "date-time"
 *      }
 * }
 * }
 * }
 * }
 */

export class CreateRoomSubmitDTO {
  @Expose()
  public roomId: string;
  @Expose()
  public roomName: string;
  @Expose()
  public roomMaxUser: number;
  @Expose()
  public roomRound: number;
  @Expose()
  public roomBet: number;
  @Expose()
  public roomPassword: string;
  @Expose()
  public roomUsePassword: boolean;
}
