export default (sequelize, DataTypes) => {
  const Channel = sequelize.define('channel', {
    name: DataTypes.STRING,
    public: DataTypes.BOOLEAN,
  });

  Channel.associate = (models) => {
    // 1:M
    Channel.belongsTo(models.Team, {
      //  To convert inot camelcase
      foreignKey: {
        name: 'teamId',
        field: 'team_id',
      },
    });
    Channel.belongsToMany(models.User, {
      through: 'channel_member',
      foreignKey: {
        name: 'channelId',
        field: 'channel_id',
      },
    });
  };

  return Channel;
};
