import DataLoader from "dataloader";
import { User } from "../entites/User";

export const createUserLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    const users = await User.findByIds(userIds as number[]);
    const userIdToUser: Record<number, User> = {};
    users.forEach((u) => {
      userIdToUser[u.id] = u;
    });
    const sortedUsers = userIds.map((userId) => userIdToUser[userId as number]);
    console.log(userIds);

    console.log(sortedUsers, "sortedUsers");

    return sortedUsers;
  });
