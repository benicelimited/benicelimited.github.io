import { Events } from 'discord.js';




export default{
    name:Events.InteractionCreate,
    async execute(interaction){

    
    const modal = new ModalBuilder()
    .setCustomId('enterprice')
    .setTitle('Price')


    // Add components to modal

    // Create the text input components
    const Price = new TextInputBuilder()
    .setCustomId('price')
    .setMaxLength(3)
    // The label is the prompt the user sees for this input
    .setLabel("Your price compared to stockx ask")
    .setPlaceholder('Example -100 or +100 ')
    // Short means only a single line of text
    .setStyle(TextInputStyle.Short);



    const SKU = new TextInputBuilder()
    .setCustomId('sku')
    // The label is the prompt the user sees for this input
    .setLabel("Enter SKU without -")
    .setPlaceholder('Example CW2288111')
    // Short means only a single line of text
    .setStyle(TextInputStyle.Short);



    // An action row only holds one text input,
    // so you need one action row per text input.
    const firstActionRow = new ActionRowBuilder().addComponents(Price);
    const secondActionRow = new ActionRowBuilder().addComponents(SKU);

    // Add inputs to the modal
    modal.addComponents(firstActionRow);
    modal.addComponents(secondActionRow);

    // Show the modal to the user
    await interaction.showModal(modal);
    }
}