let {pLog, pLogErr, cfgData, discordBot} = require('../../index.js');

module.exports = {
    name: 'guildMemberAdd',
    label: 'GuildMemberAdd',
    /**
     * @param {GuildMember} member
     */
    execute(member, client, guild) {
        if (member.bot) return;

        let User = member.toString();
        let list = [
            `${User} **just joined the server = glhf!**`,
            `${User} **just joined. Everyone, look busy!**`,
            `${User} **just joined. Can I get a heal?**`,
            `${User} **joined your party.**`,
            `${User} **joined. You must construct additional pylons.**`,
            `**Welcome,** ${User}**. Stay awhile and listen.**`,
            `**Ermagherd.** ${User} **is here.**`,
            `**Welcome,** ${User}**. We were expecting you ( ͡° ͜ʖ ͡°)**`,
            `**Welcome, **${User}**. We hope you brought pizza.**`,
            `**Welcome **${User}**. Leave your weapons by the door.**`,
            `**A wild **${User}** appeared.**`,
            `**Swoooosh. **${User}** just landed.**`,
            `**Brace yourselves. **${User}** just joined the server.**`,
            `${User}** just joined. Hide your bananas.**`,
            `${User}** just arrived. Seems OP - please nerf.**`,
            `${User}** just slid into the server.**`,
            `**A **${User}** has spawned in the server.**`,
            `**Big **${User}** showed up!**`,
            `**Where’s **${User}**? In the server!**`,
            `${User}** hopped into the server. Kangaroo!!**`,
            `${User}** just showed up. Hold my beer.**`,
            `**Challenger approaching - **${User}** has appeared!**`,
            `**It's a bird! It's a plane! Nevermind, it's just **${User}**.**`,
            `**It's **${User}**! Praise the sun! [T]/**`,
            `**Never gonna give **${User}** up. Never gonna let **${User}** down.**`,
            `**Ha! **${User}** has joined! You activated my trap card!**`,
            `**Cheers, love! **${User}**'s here!**`,
            `**Hey! Listen! **${User}** has joined!**`,
            `**We've been expecting you **${User}`,
            `**It's dangerous to go alone, take **${User}!`,
            `${User}** has joined the server! It's super effective!**`,
            `**Cheers, love! **${User}** is here!**`,
            `${User}** is here, as the prophecy foretold.**`,
            `${User}** has arrived. Party's over.**`,
            `**Ready player **${User}`,
            `${User}** is here to kick butt and chew bubblegum. And User is all out of gum.**`,
            `**Hello. Is it **${User}** you're looking for?**`,
            `${User}** has joined. Stay a while and listen!**`,
            `**Roses are red, violets are blue, **${User}** joined this server with you**`,
        ];

        let rank_role = member.guild.roles.cache.find((role) => role.id === '984923986624393227');

        let human_role = member.guild.roles.cache.find((role) => role.id === '913492240654020668');

        member.roles.add(rank_role);
        member.roles.add(human_role);

        // Code --
        var random = Math.floor(Math.random() * list.length);

        member.guild.channels.cache.get('1080544683593306253').send({content: list[random]});

        pLog(`New user [${member.id}] joined guild [${member.guild}] and got set up`, this.label);
    },
};
