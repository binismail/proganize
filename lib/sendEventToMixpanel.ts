import getUser from "@/app/actions";

const sendEventToMixpanel = async (
    eventName: string,
    user: any,
    eventProperties?: Record<string, any>,
) => {
    //here we are getting the location from a separate endpoint /api/proxy
    const locationResponse = await fetch("/api/proxy");
    const locationData = await locationResponse.json();

    //this part of code handles getting the UTM parameters that we can't get by default server side
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {
        utm_source: urlParams.get("utm_source") || undefined,
        utm_medium: urlParams.get("utm_medium") || undefined,
        utm_campaign: urlParams.get("utm_campaign") || undefined,
        utm_term: urlParams.get("utm_term") || undefined,
        utm_content: urlParams.get("utm_content") || undefined,
        id: urlParams.get("id") || undefined,
    };

    // const user = await getUser();
    // console.log("mixpanel", user);

    //Here we are including additional data that will be sent to Mixpanel like device information, UTM parameters and location
    const additionalProperties = {
        distinct_id: user?.id,
        $user_id: user?.id,
        $browser: navigator.userAgent,
        $browser_version: navigator.appVersion,
        $city: locationData.city,
        $region: locationData.region_name,
        mp_country_code: locationData.country_name,
        $current_url: window.location.href,
        $device: navigator.platform,
        $device_id: navigator.userAgent,
        $initial_referrer: document.referrer ? document.referrer : undefined,
        $initial_referring_domain: document.referrer
            ? new URL(document.referrer).hostname
            : undefined,
        $os: navigator.platform,
        $screen_height: window.screen.height,
        $screen_width: window.screen.width,
        ...utmParams,
    };
    const properties = {
        ...eventProperties,
        ...additionalProperties,
    };
    //Finally we are calling the mixpanel api route
    fetch("/api/mixpanel/event", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            event: eventName,
            properties: properties,
        }),
    });
};

export default sendEventToMixpanel;
