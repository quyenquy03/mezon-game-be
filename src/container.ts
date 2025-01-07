import { GameService, JwtService, PrismaService, RoomService, SocketGameService, UserService } from "@/services";
import { asClass, createContainer, InjectionMode } from "awilix";
import "dotenv/config";
import Application from "./app";
import { Environments } from "./constants/Environments";
import SocketService from "./services/socket/SocketService";
const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

// Register the services
container.register({
  // Register the Services
  Application: asClass(Application).singleton(),
  PrismaService:
    process.env.NODE_ENV === Environments.PRODUCTION ? asClass(PrismaService).scoped() : asClass(PrismaService).singleton(),
  // RedisService: asClass(RedisService).singleton(),
  JwtService: asClass(JwtService).singleton(),
  // GameService: asClass(GameService).singleton(),
  //   SocketGameService: asClass(SocketGameService).singleton(),
  SocketService: asClass(SocketService).singleton(),
  // RoomService: asClass(RoomService).singleton(),
  // UserService: asClass(UserService).singleton(),
});
export default container;
