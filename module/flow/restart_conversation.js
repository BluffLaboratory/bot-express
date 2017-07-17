'use strict';

/*
** Import Packages
*/
let Promise = require("bluebird");
let debug = require("debug")("bot-express:flow");
let Flow = require("./flow");

module.exports = class RestartConversationFlow extends Flow {
    /*
    ** ### Retart Conversation Flow ###
    ** -> Process parameters.
    ** -> Run final action.
    */

    constructor(messenger, bot_event, intent, previous_context, options) {
        let context = {
            _flow: "restart_conversation",
            intent: intent,
            confirmed: {},
            to_confirm: [],
            confirming: null,
            previous: {
                confirmed: [],
                message: []
            },
            _message_queue: [],
            sender_language: previous_context.sender_language
        };
        messenger.context = context;
        super(messenger, bot_event, context, options);
    }

    run(){
        debug("### This is Restart Conversation Flow. ###");

        // ### Process Parameters ###
        // If we find some parameters from initial message, add them to the conversation.
        let parameters_processed = [];
        if (this.context.intent.parameters && Object.keys(this.context.intent.parameters).length > 0){
            for (let param_key of Object.keys(this.context.intent.parameters)){
                // Parse and Add parameters using skill specific logic.
                parameters_processed.push(
                    super.apply_parameter(param_key, this.context.intent.parameters[param_key]).then(
                        (applied_parameter) => {
                            if (applied_parameter == null){
                                debug("Parameter was not applicable. We skip reaction and go to finish.");
                                return;
                            }
                            return super.react(null, applied_parameter.key, applied_parameter.value);
                        }
                    ).catch(
                        (error) => {
                            if (error.name == "BotExpressParseError"){
                                debug("Parser rejected the value.");
                                return super.react(error, param_key, this.context.intent.parameters[param_key]);
                            } else {
                                return Promise.reject(error);
                            }
                        }
                    )
                );
            }
        }
        return Promise.all(parameters_processed).then(
            (response) => {
                // ### Run Final Action ###
                return super.finish();
            }
        );
    } // End of run()
};