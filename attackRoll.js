on('chat:message', function(msg) {
    // Ignore messages not from players
    if (msg.playerid === 'API') return;

    // Check if the message is using the 'atkdmg' template and has our custom marker
    if (msg.type === 'general' && msg.content.includes('{{template_type=custom_attack}}')) {
        // Extract the message content
        let content = msg.content;

        // Create an object to store the template fields
        let fields = {};

        // Use a regular expression to parse the template fields
        let regex = /\{\{(.*?)\}\}/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            let parts = match[1].split('=');
            fields[parts[0]] = parts[1] || '';
        }

        // Check for required fields
        if (!fields.attacker_id || !fields.target_id) {
            sendChat('Error', 'Attacker or target ID missing.');
            return;
        }

        // Get attacker and target tokens
        let attacker = getObj('graphic', fields.attacker_id);
        let target = getObj('graphic', fields.target_id);

        if (!attacker) {
            sendChat('Error', 'Invalid attacker token ID.');
            return;
        }

        if (!target) {
            sendChat('Error', 'Invalid target token ID.');
            return;
        }

        // Ensure inline rolls are present
        if (!msg.inlinerolls || msg.inlinerolls.length < 3) {
            sendChat('Error', 'No inline rolls found.');
            return;
        }

        // Extract inline rolls based on their order in the message
        // Assuming the order is:
        // 0: mod
        // 1: r1 (attack roll)
        // 2: r2 (second attack roll)
        // 3: dmg1 (damage roll)
        // 4: crit1 (critical damage roll)

        // Find the indices of the inline rolls in the message
        let rollIndices = [];
        let rollRegex = /\$\[\[(\d+)\]\]/g;
        while ((match = rollRegex.exec(content)) !== null) {
            rollIndices.push(parseInt(match[1]));
        }

        if (rollIndices.length < 5) {
            sendChat('Error', 'Insufficient inline rolls found.');
            return;
        }

        // Map the rolls
        let modRollIndex = rollIndices[0];
        let r1RollIndex = rollIndices[1];
        let r2RollIndex = rollIndices[2];
        let dmg1RollIndex = rollIndices[3];
        let crit1RollIndex = rollIndices[4];

        let attackRollResult = msg.inlinerolls[r1RollIndex].results.total;
        let damageRollResult = msg.inlinerolls[dmg1RollIndex].results.total;
        let critDamageRollResult = msg.inlinerolls[crit1RollIndex].results.total;

        // Get the natural d20 roll to check for critical hits
        let attackRollDetails = msg.inlinerolls[r1RollIndex].results.rolls;
        let attackRoll = null;

        // Find the d20 roll
        for (let roll of attackRollDetails) {
            if (roll.type === 'R' && roll.dice === 1 && roll.sides === 20) {
                attackRoll = roll.results[0].v;
                break;
            }
        }

        if (attackRoll === null) {
            sendChat('Error', 'Failed to parse attack roll.');
            return;
        }

        let isCritical = (attackRoll === 20);

        // Get target's AC (assuming it's stored in bar2_value)
        let targetAC = parseInt(target.get('bar2_value') || 10, 10); // Default AC 10 if not set

        // Determine hit or miss
        let hit = attackRollResult >= targetAC;

        // Apply damage if hit
        if (hit) {
            let totalDamage = damageRollResult;

            // Handle critical hits
            if (isCritical) {
                totalDamage += critDamageRollResult;
            }

            // Apply damage to target's HP (assuming it's stored in bar1_value)
            let targetHP = parseInt(target.get('bar1_value') || 0, 10);
            target.set('bar1_value', targetHP - totalDamage);

            sendChat('Attack Result', `${attacker.get('name')} hits ${target.get('name')} with ${fields.rname} for ${totalDamage} ${fields.dmg1type} damage!`);

            if (isCritical) {
                sendChat('Attack Result', 'A critical hit!');
            }
        } else {
            sendChat('Attack Result', `${attacker.get('name')} misses ${target.get('name')} with ${fields.rname}!`);
        }
    }
});