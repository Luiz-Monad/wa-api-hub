import WhatsAppInstance from '../class/instance'
import config from '../../config/config'
import { ReqHandler } from '../helper/types'
import getInstanceForReq, { getInstanceService } from '../service/instance'
import { getSessionService } from '../service/session'

export const init: ReqHandler = async (req, res) => {
    const key = <string>req.query.key
    const mobile = !req.query.mobile ? false : !!req.query.mobile
    const webhook = !req.query.webhook ? false : !!req.query.webhook
    const webhookUrl = !req.query.webhook ? undefined : <string>req.query.webhookUrl
    const websocket = !req.query.websocket ? false : !!req.query.websocket
    const appUrl = config.appUrl || req.protocol + '://' + req.headers.host
    const instance = new WhatsAppInstance(req.app, {
        key: key,
        mobile: mobile,
        allowCallback: webhook || websocket,
        callbackAddress: webhookUrl,
    })
    const data = await instance.init()
    res.json({
        error: false,
        message: 'Initializing successfully',
        key: data.config.key,
        webhook: {
            enabled: webhook,
            webhookUrl: webhookUrl,
        },
        qrcode: {
            url: appUrl + '/instance/qr?key=' + data.config.key,
        },
        browser: config.browser,
    })
}

export const qr: ReqHandler = async (req, res) => {
    try {
        const qrcode = await getInstanceForReq(req)?.config.qr
        res.render('qrcode', {
            qrcode: qrcode,
        })
    } catch {
        res.json({
            qrcode: '',
        })
    }
}

export const qrbase64: ReqHandler = async (req, res) => {
    try {
        const qrcode = await getInstanceForReq(req)?.config.qr
        res.json({
            error: false,
            message: 'QR Base64 fetched successfully',
            qrcode: qrcode,
        })
    } catch {
        res.json({
            qrcode: '',
        })
    }
}

export const qrurl: ReqHandler = async (req, res) => {
    try {
        const qrurl = await getInstanceForReq(req)?.config.qr_url
        res.json({
            error: false,
            message: 'QR url fetched successfully',
            qrcode: qrurl,
        })
    } catch {
        res.json({
            qrcode: '',
        })
    }
}

export const info: ReqHandler = async (req, res) => {
    const instance = getInstanceForReq(req)
    const data = await instance.getInstanceDetail()
    return res.json({
        error: false,
        message: 'Instance fetched successfully',
        instance_data: data,
    })
}

export const restore: ReqHandler = async (req, res) => {
    const session = getSessionService(req.app)
    const restoredSessions = await session.restoreSessions()
    return res.json({
        error: false,
        message: 'All instances restored',
        data: restoredSessions,
    })
}

export const logout: ReqHandler = async (req, res) => {
    let errormsg
    try {
        await getInstanceForReq(req).logout()
    } catch (error) {
        errormsg = error
    }
    return res.json({
        error: false,
        message: 'logout successfull',
        errormsg: errormsg ? errormsg : null,
    })
}

export const remove: ReqHandler = async (req, res) => {
    let errormsg
    try {
        const instance = getInstanceForReq(req)
        await instance.deleteInstance()
    } catch (error) {
        errormsg = error
    }
    return res.json({
        error: false,
        message: 'Instance deleted successfully',
        data: errormsg ? errormsg : null,
    })
}

export const list: ReqHandler = async (req, res) => {
    const service = getInstanceService(req.app)
    const readDetails = async (keys: string[]) => {
        const instances = []
        for (const key of keys) {
            try {
                instances.push(await service.get(key).getInstanceDetail())
            } catch {}
        }
        return instances
    }
    if (req.query.active) {
        const instances = service.list()
        return res.json({
            error: false,
            message: 'All active instances',
            data: await readDetails(instances),
        })
    }
    const keys = await getSessionService(req.app).readSessions()
    return res.json({
        error: false,
        message: 'All instances listed',
        data: await readDetails(keys),
    })
}
