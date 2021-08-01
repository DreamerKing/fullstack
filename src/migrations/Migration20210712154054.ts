import { Migration } from '@mikro-orm/migrations';

export class Migration20210712154054 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `user` add `email` json not null;');
    this.addSql('alter table `user` modify `username` json;');
    this.addSql('alter table `user` add unique `user_email_unique`(`email`);');
    this.addSql('alter table `user` add unique `user_username_unique`(`username`);');

    this.addSql('alter table `user` add unique `user_username_unique`(`username`);');

    this.addSql('alter table `user` add unique `user_email_unique`(`email`);');
  }

}
