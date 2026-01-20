'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  PiEnvelopeSimple, 
  PiPhone, 
  PiMapPin, 
  PiPaperPlaneRight,
  PiChatCircleText,
  PiClock
} from "react-icons/pi";
import { useToast } from "@/hooks/use-toast";

const contactInfo = [
  {
    icon: PiPhone,
    title: "Phone",
    value: "076 691 4650 | 077 453 3233",
    link: "tel:0766914650",
  },
  {
    icon: PiEnvelopeSimple,
    title: "Email",
    value: "info@smartlabs.lk",
    link: "mailto:info@smartlabs.lk",
  },
  {
    icon: PiMapPin,
    title: "Location",
    value: "3rd Floor, No. 326, Jana Jaya Building, Rajagiriya",
    link: "#",
  },
  {
    icon: PiClock,
    title: "Hours",
    value: "Mon - Sat: 9:00 AM - 8:00 PM",
    link: "#",
  },
];

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="py-24 bg-dots">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
              Get in Touch
            </span>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
              We'd Love to
              <span className="text-accent"> Hear From You</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Have questions about our courses or booking process? Our team is here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-white rounded-3xl p-8 border border-border shadow-lg">
                <h2 className="font-display text-2xl font-bold mb-6">Send us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input
                        id="name"
                        placeholder="John Smith"
                        className="py-6"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="py-6"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="How can we help you?"
                      className="py-6"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about your inquiry..."
                      className="min-h-[150px] resize-none"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full btn-accent group">
                    <PiPaperPlaneRight className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Info Cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                {contactInfo.map((info, index) => (
                  <a
                    key={index}
                    href={info.link}
                    className="bg-white rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <info.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <h3 className="font-semibold mb-1">{info.title}</h3>
                    <p className="text-sm text-muted-foreground">{info.value}</p>
                  </a>
                ))}
              </div>

              {/* WhatsApp Card */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                    <PiChatCircleText className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold">Chat on WhatsApp</h3>
                    <p className="text-white/80">Get instant responses</p>
                  </div>
                </div>
                <p className="mb-6 text-white/90">
                  Prefer messaging? Connect with our team directly on WhatsApp for quick answers 
                  to your questions about courses and bookings.
                </p>
                <a
                  href="https://wa.me/94766914650"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" className="w-full bg-white text-green-600 hover:bg-white/90">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Start WhatsApp Chat
                  </Button>
                </a>
              </div>

              {/* Map Placeholder */}
              <div className="bg-secondary rounded-2xl p-8 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Visit Our Center</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  3rd Floor, No. 326, Jana Jaya Building, Rajagiriya
                </p>
                <Button variant="outline">
                  Get Directions
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
