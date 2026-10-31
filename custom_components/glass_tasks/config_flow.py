"""Config and options flow."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    SelectSelector,
    SelectSelectorConfig,
    TextSelector,
)

from .const import (
    CONF_NOTIFY_EVERYONE,
    CONF_NOTIFY_URL,
    DOMAIN,
)


class GlassTasksConfigFlow(ConfigFlow, domain=DOMAIN):
    """Single-instance setup."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title="Glass Task Board", data={})
        return self.async_show_form(step_id="user")

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return GlassTasksOptionsFlow()


class GlassTasksOptionsFlow(OptionsFlow):
    """Pick which phones get overdue reminders for each person."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data=user_input)

        options = self.config_entry.options
        notify_services = sorted(
            f"notify.{name}" for name in self.hass.services.async_services().get("notify", {})
        )
        notify_selector = SelectSelector(
            SelectSelectorConfig(options=notify_services, multiple=True, custom_value=True)
        )

        schema: dict[Any, Any] = {}
        for state in sorted(self.hass.states.async_all("person"), key=lambda s: s.name):
            schema[
                vol.Optional(state.entity_id, description={"suggested_value": options.get(state.entity_id, [])})
            ] = notify_selector
        schema[
            vol.Optional(CONF_NOTIFY_EVERYONE, description={"suggested_value": options.get(CONF_NOTIFY_EVERYONE, [])})
        ] = notify_selector
        schema[
            vol.Optional(CONF_NOTIFY_URL, description={"suggested_value": options.get(CONF_NOTIFY_URL, "")})
        ] = TextSelector()
        return self.async_show_form(step_id="init", data_schema=vol.Schema(schema))
