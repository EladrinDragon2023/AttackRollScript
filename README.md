# AttackRollScript
Roll 20 attack roll script that auto applies damage and checks attack against ac.

Things To Note

Player health needs to be attached to bar 1 on token

Player AC needs to be attached to bar 2 on token

This script only works on template attacks that have the template_type tag custom_attack

Example Macro
&{template:atkdmg} {{template_type=custom_attack}} {{attacker_id=@{selected|token_id}}} {{target_id=@{target|token_id}}} {{mod=+[[5]]}} {{rname=Longsword}} {{r1=[[1d20 + 5]]}} {{normal=1}} {{r2=[[1d20 + 5]]}} {{attack=1}} {{damage=1}} {{dmg1flag=1}} {{dmg1=[[1d8 + 3]]}} {{dmg1type=Slashing}} {{crit1=[[1d8 + 3]]}}

In order for the script to read the attack template correctly there needs to be at least 5 inline rolls, the rest of the information is self explanatory with the macro

Also requires installation of token mod script in your game
