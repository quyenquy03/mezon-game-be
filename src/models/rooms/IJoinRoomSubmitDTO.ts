import { Expose } from "class-transformer";
export class IJoinRoomSubmitDTO {
  @Expose()
  public roomId: string;
  @Expose()
  public userId: string;
}
